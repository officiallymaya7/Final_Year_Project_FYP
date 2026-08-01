import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import creovatorLogo from "@/assets/creovator-logo.png";
import {
  ArrowLeft, Lock, CreditCard, Landmark, Smartphone, Check, ShieldCheck,
} from "lucide-react";

// Fallback plan in case someone lands here directly without picking a plan
const defaultPlan = {
  name: "Pro",
  price: "29",
  period: "/month",
  features: ["Unlimited Events", "1,000 Participants", "Limited Email Automation", "Custom Templates", "Analytics", "QR Check-in"],
};

const banks = ["HBL", "UBL", "Meezan Bank", "Bank Alfalah", "MCB", "Allied Bank"];

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { plan?: typeof defaultPlan } };
  const plan = location.state?.plan ?? defaultPlan;

  const [method, setMethod] = useState<"card" | "bank" | "wallet">("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Billing
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Card
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Bank
  const [selectedBank, setSelectedBank] = useState(banks[0]);
  const [accountTitle, setAccountTitle] = useState("");

  // Wallet
  const [walletProvider, setWalletProvider] = useState<"jazzcash" | "easypaisa">("jazzcash");
  const [walletNumber, setWalletNumber] = useState("");

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    // TODO: replace with real payment gateway call (Stripe/PayFast/JazzCash API etc.)
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
    }, 1800);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Payment Successful</h1>
          <p className="text-muted-foreground mb-8">
            Your <span className="text-primary font-semibold">{plan.name}</span> plan is now active. A receipt has been sent to {email || "your email"}.
          </p>
          <Button size="lg" className="h-12 px-8" onClick={() => navigate("/")}>
            Go to Dashboard <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <img src={creovatorLogo} alt="Creovator" className="w-32 h-auto object-contain" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5" /> Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        {/* Payment form */}
        <div>
          <h1 className="text-3xl font-bold mb-1">Complete your subscription</h1>
          <p className="text-muted-foreground mb-8">Choose how you'd like to pay for the {plan.name} plan.</p>

          <form onSubmit={handlePay} className="space-y-8">
            {/* Billing details */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Billing Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Your Name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Payment Method</h2>
              <Tabs value={method} onValueChange={(v) => setMethod(v as typeof method)}>
                <TabsList className="grid grid-cols-3 w-full h-auto p-1">
                  <TabsTrigger value="card" className="flex items-center gap-2 py-2.5">
                    <CreditCard className="w-4 h-4" /> Card
                  </TabsTrigger>
                  <TabsTrigger value="bank" className="flex items-center gap-2 py-2.5">
                    <Landmark className="w-4 h-4" /> Bank Transfer
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="flex items-center gap-2 py-2.5">
                    <Smartphone className="w-4 h-4" /> Mobile Wallet
                  </TabsTrigger>
                </TabsList>

                {/* Card */}
                <TabsContent value="card" className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input id="cardName" required={method === "card"} value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="E.G. YOUR NAME" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      required={method === "card"}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" required={method === "card"} value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" required={method === "card"} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="123" inputMode="numeric" />
                    </div>
                  </div>
                </TabsContent>

                {/* Bank Transfer */}
                <TabsContent value="bank" className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bank">Select Your Bank</Label>
                    <select
                      id="bank"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {banks.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="accountTitle">Account Title</Label>
                    <Input id="accountTitle" required={method === "bank"} value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder="Account holder name" />
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground leading-relaxed">
                    After clicking <span className="font-semibold text-foreground">Pay Now</span>, you'll be redirected to {selectedBank}'s secure payment gateway to authorize the transfer of <span className="font-semibold text-foreground">${plan.price}</span>.
                  </div>
                </TabsContent>

                {/* Mobile Wallet */}
                <TabsContent value="wallet" className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setWalletProvider("jazzcash")}
                      className={`rounded-xl border p-4 text-left transition-all ${walletProvider === "jazzcash" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-border"}`}
                    >
                      <span className="font-bold text-foreground">JazzCash</span>
                      <p className="text-xs text-muted-foreground mt-1">Pay via JazzCash mobile account</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletProvider("easypaisa")}
                      className={`rounded-xl border p-4 text-left transition-all ${walletProvider === "easypaisa" ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-border"}`}
                    >
                      <span className="font-bold text-foreground">EasyPaisa</span>
                      <p className="text-xs text-muted-foreground mt-1">Pay via EasyPaisa mobile account</p>
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="walletNumber">Mobile Account Number</Label>
                    <Input id="walletNumber" required={method === "wallet"} value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} placeholder="03xx-xxxxxxx" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You'll receive an OTP prompt on this number to confirm the payment of ${plan.price}.
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <Button type="submit" size="lg" disabled={processing} className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20">
              {processing ? "Processing..." : `Pay $${plan.price} Now`}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" /> Payments are encrypted and processed securely.
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-3xl border border-border/50 bg-muted/10 backdrop-blur-xl p-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-none px-3 py-1">{plan.name.toUpperCase()} PLAN</Badge>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground text-sm">{plan.period}</span>
            </div>
            <div className="space-y-3 mb-6">
              {plan.features.map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feat}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border/50 pt-4 flex items-center justify-between">
              <span className="font-semibold">Total due today</span>
              <span className="font-bold text-lg text-primary">${plan.price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;