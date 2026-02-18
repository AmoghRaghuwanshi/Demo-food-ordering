
import React, { useState, useCallback } from 'react';
import { MenuItem, Order, OrderStatus, ViewMode, CartItem, UserSession, Offer, DetailedAddress } from './types';
import { INITIAL_MENU } from './constants';
import CustomerView from './views/CustomerView';
import OwnerView from './views/OwnerView';
import AuthView from './views/AuthView';

const OWNER_PHONE = '9876543210';
const DEFAULT_RESTAURANT_LOC = { lat: 28.6139, lng: 77.2090 };

const App: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU.map(item => ({ ...item, gstRate: 5 })));
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRestaurantLive, setIsRestaurantLive] = useState(true);
  const [deliveryRatePerKm, setDeliveryRatePerKm] = useState(40);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);
  const [offers, setOffers] = useState<Offer[]>([
    { id: 'off1', code: 'WELCOME50', description: '₹50 off on orders above ₹500', type: 'fixed', value: 50, minCartValue: 500, isActive: true }
  ]);
  const [viewMode, setViewMode] = useState<ViewMode>('auth');
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const handleLogin = (phone: string) => {
    const role = phone === OWNER_PHONE ? 'owner' : 'customer';
    setUserSession({ phone, role });
    setViewMode(role);
  };

  const handleLogout = () => {
    setUserSession(null);
    setViewMode('auth');
  };

  const onPlaceOrder = useCallback((
    items: CartItem[], 
    subtotal: number, 
    address: DetailedAddress, 
    deliveryCharge: number, 
    appliedOffer: Offer | null, 
    location: { lat: number; lng: number }
  ) => {
    let calculatedDiscount = 0;
    if (appliedOffer && subtotal >= appliedOffer.minCartValue) {
      if (appliedOffer.type === 'percent') {
        calculatedDiscount = (subtotal * appliedOffer.value) / 100;
        if (appliedOffer.maxDiscount && appliedOffer.maxDiscount > 0) {
          calculatedDiscount = Math.min(calculatedDiscount, appliedOffer.maxDiscount);
        }
      } else {
        calculatedDiscount = appliedOffer.value;
      }
    }

    const totalGst = items.reduce((acc, item) => acc + (item.price * item.quantity * item.gstRate) / 100, 0);
    const total = subtotal + totalGst + deliveryCharge - calculatedDiscount;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      items,
      subtotal,
      itemGstBreakdown: items.map(i => ({ name: i.name, rate: i.gstRate, amount: (i.price * i.quantity * i.gstRate) / 100 })),
      totalGst,
      deliveryCharge,
      discount: calculatedDiscount,
      total,
      status: 'pending',
      timestamp: Date.now(),
      customerName: userSession?.phone || 'Guest',
      address,
      phone: userSession?.phone || '',
      location
    };

    setOrders(prev => [newOrder, ...prev]);
  }, [userSession]);

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateMenuAvailability = (id: string, available: boolean) => {
    setMenu(prev => prev.map(m => m.id === id ? { ...m, isAvailable: available } : m));
  };

  const addDish = (dish: Omit<MenuItem, 'id'>) => {
    setMenu(prev => [...prev, { ...dish, id: Date.now().toString() }]);
  };

  const deleteDish = (id: string) => {
    setMenu(prev => prev.filter(m => m.id !== id));
  };

  if (viewMode === 'auth') return <AuthView onLogin={handleLogin} />;

  if (viewMode === 'owner') return (
    <OwnerView 
      menu={menu}
      orders={orders}
      isRestaurantLive={isRestaurantLive}
      deliveryRatePerKm={deliveryRatePerKm}
      onSetDeliveryRatePerKm={setDeliveryRatePerKm}
      freeDeliveryThreshold={freeDeliveryThreshold}
      onSetFreeDeliveryThreshold={setFreeDeliveryThreshold}
      offers={offers}
      onSetOffers={setOffers}
      onUpdateOrderStatus={updateOrderStatus}
      onUpdateMenuAvailability={updateMenuAvailability}
      onSetRestaurantLive={setIsRestaurantLive}
      onAddDish={addDish}
      onDeleteDish={deleteDish}
      onLogout={handleLogout}
    />
  );

  return (
    <CustomerView 
      menu={menu.filter(m => m.isAvailable)}
      orders={orders.filter(o => o.phone === userSession?.phone)}
      isRestaurantLive={isRestaurantLive}
      deliveryRatePerKm={deliveryRatePerKm}
      freeDeliveryThreshold={freeDeliveryThreshold}
      offers={offers}
      restaurantLocation={DEFAULT_RESTAURANT_LOC}
      onPlaceOrder={onPlaceOrder}
      onLogout={handleLogout}
    />
  );
};

export default App;
