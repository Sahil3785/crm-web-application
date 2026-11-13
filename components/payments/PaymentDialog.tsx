"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Copy, CreditCard, Loader2, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { COMPANY, buildUpiLink } from "@/lib/company";

type Payment = {
  id: string;
  reference: string;
  client_name: string;
  client_phone: string | null;
  amount: number;
  purpose: string | null;
  status: "Pending" | "Paid";
  payment_link: string;
  created_at: string;
  paid_at: string | null;
};

const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

const newReference = () => `PAY-${Date.now().toString(36).toUpperCase()}`;

function whatsappUrl(p: Pick<Payment, "client_name" | "client_phone" | "amount" | "purpose" | "payment_link" | "reference">) {
  const text = [
    `Hi ${p.client_name},`,
    `Here is your payment request from ${COMPANY.legalName}.`,
    `Amount: ${formatINR(p.amount)}${p.purpose ? `\nFor: ${p.purpose}` : ""}`,
    `Reference: ${p.reference}`,
    `UPI ID: ${COMPANY.payments.upiId}`,
    `Pay with any UPI app: ${p.payment_link}`,
  ].join("\n");
  const digits = (p.client_phone || "").replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function PaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState("new");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadPayments = async () => {
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(20);
    setPayments((data as Payment[]) || []);
  };

  useEffect(() => {
    if (open) loadPayments();
  }, [open]);

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setAmount("");
    setPurpose("");
    setCreated(null);
  };

  const createRequest = async () => {
    const value = Number(amount);
    if (!clientName.trim()) return toast.error("Enter the client's name");
    if (!Number.isFinite(value) || value <= 0) return toast.error("Enter an amount greater than zero");

    setSaving(true);
    const reference = newReference();
    const row = {
      reference,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim() || null,
      amount: Math.round(value * 100) / 100,
      purpose: purpose.trim() || null,
      status: "Pending" as const,
      payment_link: buildUpiLink({ amount: value, note: purpose.trim() || `Payment to ${COMPANY.name}`, reference }),
      created_at: new Date().toISOString(),
      paid_at: null,
    };
    const { data, error } = await supabase.from("payments").insert(row).select().single();
    setSaving(false);
    if (error) return toast.error("Could not create the payment request");
    setCreated(data as Payment);
    toast.success("Payment request created");
    loadPayments();
  };

  const markPaid = async (p: Payment) => {
    const { error } = await supabase
      .from("payments")
      .update({ status: "Paid", paid_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error("Could not update the payment");
    toast.success(`${p.reference} marked as paid`);
    if (created?.id === p.id) setCreated({ ...created, status: "Paid" });
    loadPayments();
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payments
          </DialogTitle>
          <DialogDescription>
            Collect client payments by UPI to <span className="font-medium">{COMPANY.payments.upiId}</span> (
            {COMPANY.payments.payeeName}).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">New request</TabsTrigger>
            <TabsTrigger value="recent">Recent ({payments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            {!created ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-client">Client name</Label>
                  <Input id="pay-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Rahul Khanna" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-phone">WhatsApp number (optional)</Label>
                  <Input id="pay-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount (₹)</Label>
                  <Input id="pay-amount" type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-purpose">Purpose (optional)</Label>
                  <Input id="pay-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Website development, advance" />
                </div>
                <Button className="w-full" onClick={createRequest} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Create payment request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{created.reference}</span>
                    <Badge variant={created.status === "Paid" ? "default" : "secondary"}>{created.status}</Badge>
                  </div>
                  <p className="text-2xl font-semibold">{formatINR(created.amount)}</p>
                  <p className="text-sm">{created.client_name}</p>
                  {created.purpose && <p className="text-sm text-muted-foreground">{created.purpose}</p>}
                </div>
                <div className="space-y-2">
                  <Label>UPI payment link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={created.payment_link} className="text-xs" />
                    <Button variant="outline" size="icon" onClick={() => copy(created.payment_link, "Payment link")} aria-label="Copy payment link">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => window.open(whatsappUrl(created), "_blank")}>
                    <MessageCircle className="h-4 w-4 mr-2" /> Send on WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => (window.location.href = created.payment_link)}>
                    <Smartphone className="h-4 w-4 mr-2" /> Open in UPI app
                  </Button>
                  <Button variant="outline" onClick={() => copy(COMPANY.payments.upiId, "UPI ID")}>
                    <Copy className="h-4 w-4 mr-2" /> Copy UPI ID
                  </Button>
                  <Button onClick={() => markPaid(created)} disabled={created.status === "Paid"}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as paid
                  </Button>
                </div>
                <Button variant="ghost" className="w-full" onClick={resetForm}>
                  Create another request
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No payment requests yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.reference} · {new Date(p.created_at).toLocaleDateString("en-IN")}
                        {p.purpose ? ` · ${p.purpose}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold">{formatINR(p.amount)}</span>
                      {p.status === "Paid" ? (
                        <Badge>Paid</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markPaid(p)}>
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
