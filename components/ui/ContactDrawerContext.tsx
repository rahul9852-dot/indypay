'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ContactDrawerCtx {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const ContactDrawerContext = createContext<ContactDrawerCtx>({
  open: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function ContactDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ContactDrawerContext.Provider
      value={{ open, openDrawer: () => setOpen(true), closeDrawer: () => setOpen(false) }}
    >
      {children}
    </ContactDrawerContext.Provider>
  );
}

export function useContactDrawer() {
  return useContext(ContactDrawerContext);
}
