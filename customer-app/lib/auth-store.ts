import { create } from "zustand";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  loyaltyPoints: number;
};

type SignInPayload = {
  email: string;
  password: string;
};

type SignUpPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type AuthStore = {
  users: Array<AuthUser & { password: string }>;
  user: AuthUser | null;
  signIn: (payload: SignInPayload) => { ok: boolean; message: string };
  signUp: (payload: SignUpPayload) => { ok: boolean; message: string };
  signOut: () => void;
};

const seededUsers: Array<AuthUser & { password: string }> = [
  {
    id: "user-1",
    name: "Ava Rahman",
    email: "ava.rahman@example.com",
    phone: "01711-223344",
    password: "123456",
    location: "Netrakona Sadar, Mymensingh",
    loyaltyPoints: 1280,
  },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  users: seededUsers,
  user: null,
  signIn: ({ email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const existingUser = get().users.find(
      (entry) =>
        normalizeEmail(entry.email) === normalizedEmail &&
        entry.password === password.trim(),
    );

    if (!existingUser) {
      return {
        ok: false,
        message: "Email বা password ঠিক হয়নি।",
      };
    }

    const { password: _password, ...user } = existingUser;
    set({ user });

    return {
      ok: true,
      message: "Welcome back",
    };
  },
  signUp: ({ name, email, phone, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPhone = phone.trim();

    if (
      get().users.some(
        (entry) => normalizeEmail(entry.email) === normalizedEmail,
      )
    ) {
      return {
        ok: false,
        message: "এই email দিয়ে already account আছে।",
      };
    }

    const nextUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: trimmedPhone,
      password: password.trim(),
      location: "Netrakona Sadar, Mymensingh",
      loyaltyPoints: 180,
    };

    const { password: _password, ...user } = nextUser;

    set((state) => ({
      users: [...state.users, nextUser],
      user,
    }));

    return {
      ok: true,
      message: "Account created",
    };
  },
  signOut: () => set({ user: null }),
}));

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
