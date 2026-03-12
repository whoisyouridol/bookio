import { createContext, useContext, useState, type ReactNode } from 'react';
import type { MasterServiceDto, TimeSlotDto } from '@/types';

interface BookingState {
  salonId: string | null;
  salonName: string | null;
  masterId: string | null;
  masterName: string | null;
  selectedServices: MasterServiceDto[];
  totalPrice: number;
  totalDuration: number;
  selectedDate: string | null;
  selectedSlot: TimeSlotDto | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

interface BookingContextType extends BookingState {
  setSalon: (id: string, name: string) => void;
  setMaster: (id: string, name: string) => void;
  toggleService: (service: MasterServiceDto) => void;
  setDateTime: (date: string, slot: TimeSlotDto) => void;
  setClientInfo: (name: string, phone: string, email: string) => void;
  reset: () => void;
}

const initial: BookingState = {
  salonId: null,
  salonName: null,
  masterId: null,
  masterName: null,
  selectedServices: [],
  totalPrice: 0,
  totalDuration: 0,
  selectedDate: null,
  selectedSlot: null,
  clientName: '',
  clientPhone: '',
  clientEmail: '',
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(initial);

  const setSalon = (id: string, name: string) =>
    setState(s => ({ ...s, salonId: id, salonName: name }));

  const setMaster = (id: string, name: string) =>
    setState(s => ({ ...s, masterId: id, masterName: name, selectedServices: [], totalPrice: 0, totalDuration: 0 }));

  const toggleService = (service: MasterServiceDto) =>
    setState(s => {
      const exists = s.selectedServices.some(sv => sv.id === service.id);
      const next = exists
        ? s.selectedServices.filter(sv => sv.id !== service.id)
        : [...s.selectedServices, service];
      return {
        ...s,
        selectedServices: next,
        totalPrice: next.reduce((sum, sv) => sum + sv.price, 0),
        totalDuration: next.reduce((sum, sv) => sum + sv.durationMinutes, 0),
      };
    });

  const setDateTime = (date: string, slot: TimeSlotDto) =>
    setState(s => ({ ...s, selectedDate: date, selectedSlot: slot }));

  const setClientInfo = (name: string, phone: string, email: string) =>
    setState(s => ({ ...s, clientName: name, clientPhone: phone, clientEmail: email }));

  const reset = () => setState(initial);

  return (
    <BookingContext.Provider value={{ ...state, setSalon, setMaster, toggleService, setDateTime, setClientInfo, reset }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
