import DashboardHeader from "@/components/DashboardHeader";
import { Mail } from "lucide-react";

const EmailAutomation = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Email Automation</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          This module is under development. Soon you'll be able to send AI-generated
          emails directly to participants, guests, and speakers — right from Creovator.
        </p>
      </div>
    </div>
  );
};

export default EmailAutomation;