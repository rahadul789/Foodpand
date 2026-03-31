import { create } from "zustand";

export type PaymentMethodId = "cod" | "bkash";

type PaymentMethodOption = {
  id: PaymentMethodId;
  title: string;
  subtitle: string;
  icon: "cash-outline" | "phone-portrait-outline";
  color: string;
};

type PaymentState = {
  selectedMethod: PaymentMethodId;
  setSelectedMethod: (method: PaymentMethodId) => void;
};

export const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: "cod",
    title: "Cash on delivery",
    subtitle: "Pay in cash when your order arrives at the doorstep.",
    icon: "cash-outline",
    color: "#E0F4D7",
  },
  {
    id: "bkash",
    title: "bKash",
    subtitle: "Let users choose bKash now and plug in real gateway logic later.",
    icon: "phone-portrait-outline",
    color: "#FFE3F0",
  },
];

export const getPaymentMethodMeta = (method: PaymentMethodId) =>
  paymentMethodOptions.find((option) => option.id === method) ??
  paymentMethodOptions[0];

export const usePaymentStore = create<PaymentState>((set) => ({
  selectedMethod: "cod",
  setSelectedMethod: (method) => set({ selectedMethod: method }),
}));
