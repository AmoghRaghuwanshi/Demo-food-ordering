
import React, { useState, useRef, useEffect } from 'react';
import { MenuItem, Order, OrderStatus, Offer } from '../types';
import { Badge, Button, Card } from '../components/Shared';
import { CATEGORIES } from '../constants';

interface OwnerViewProps {
  menu: MenuItem[];
  orders: Order[];
  isRestaurantLive: boolean;
  deliveryRatePerKm: number;
  onSetDeliveryRatePerKm: (rate: number) => void;
  freeDeliveryThreshold: number;
  onSetFreeDeliveryThreshold: (val: number) => void;
  offers: Offer[];
  onSetOffers: (offers: Offer[]) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateMenuAvailability: (itemId: string, available: boolean) => void;
  onSetRestaurantLive: (isLive: boolean) => void;
  onAddDish: (dish: Omit<MenuItem, 'id'>) => void;
  onDeleteDish: (id: string) => void;
  onLogout: () => void;
}

const OwnerView: React.FC<OwnerViewProps> = ({ 
  menu, orders, isRestaurantLive, deliveryRatePerKm, onSetDeliveryRatePerKm, 
  freeDeliveryThreshold, onSetFreeDeliveryThreshold, offers, onSetOffers,
  onUpdateOrderStatus, onUpdateMenuAvailability, onSetRestaurantLive, onAddDish, onDeleteDish, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'settings'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState<Order | null>(null);
  
  const mapInstanceRef = useRef<any>(null);

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const totalRevenue = orders.reduce((sum, o) => o.status === 'delivered' ? sum + o.total : sum, 0);

  // Initialize Google Maps for order tracking
  useEffect(() => {
    if (showMapModal && showMapModal.location && (window as any).google) {
      const timer = setTimeout(() => {
        const container = document.getElementById('order-view-map');
        if (container) {
          const mapOptions = {
            center: { lat: showMapModal.location!.lat, lng: showMapModal.location!.lng },
            zoom: 16,
            disableDefaultUI: true,
            styles: [
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
          };
          
          const map = new (window as any).google.maps.Map(container, mapOptions);
          new (window as any).google.maps.Marker({
            position: { lat: showMapModal.location!.lat, lng: showMapModal.location!.lng },
            map: map,
            title: `Customer: ${showMapModal.customerName}`
          });
          
          mapInstanceRef.current = map;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showMapModal]);

  const [newDish, setNewDish] = useState<Omit<MenuItem, 'id' | 'image'>>({
    name: '', description: '', price: 0, category: 'Main Course', isAvailable: true, isVeg: true, isSpicy: false, gstRate: 5
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDish({ ...newDish, image: 'https://picsum.photos/seed/food/400/300' });
    setShowAddModal(false);
  };

  const inputClass = "w-full border border-slate-300 bg-white p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none";

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-md mx-auto shadow-2xl relative overflow-hidden">
      <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">B</div>
          {activeTab}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <span className={`text-[10px] font-bold uppercase ${isRestaurantLive ? 'text-green-500' : 'text-slate-400'}`}>
              {isRestaurantLive ? 'Live' : 'Closed'}
            </span>
            <button 
              onClick={() => onSetRestaurantLive(!isRestaurantLive)} 
              className={`relative h-5 w-9 rounded-full transition-colors ${isRestaurantLive ? 'bg-green-500' : 'bg-slate-300'}`}
            >
              <span className={`block h-4 w-4 rounded-full bg-white shadow transform transition ${isRestaurantLive ? 'translate-x-4' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-white border-none shadow-md">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(0)}</p>
              </Card>
              <Card className="p-4 bg-white border-none shadow-md">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{activeOrders.length}</p>
              </Card>
            </div>
            <Card className="p-4">
               <button onClick={onLogout} className="text-red-500 text-sm font-bold w-full text-center">Logout from Dashboard</button>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <div className="text-center py-24 text-slate-400 italic">No active orders yet.</div>
            ) : (
              activeOrders.map(order => (
                <Card key={order.id} className="p-5 border-l-4 border-orange-500 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Order #{order.id.slice(0, 6)}</h3>
                      <p className="text-xs text-slate-500">{order.customerName}</p>
                    </div>
                    <Badge color="bg-orange-100 text-orange-700">{order.status.toUpperCase()}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 !py-3 text-xs" onClick={() => setShowMapModal(order)}>View Location</Button>
                    <Button className="flex-1 !py-3 text-xs" onClick={() => onUpdateOrderStatus(order.id, 'delivered')}>Mark Delivered</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Live Menu</h3>
              <Button onClick={() => setShowAddModal(true)} className="!py-1.5 !px-3 text-xs">Add Dish</Button>
            </div>
            {menu.map(item => (
              <Card key={item.id} className="flex items-center gap-4 p-3 shadow-sm">
                <img src={item.image} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                  <p className="text-xs text-slate-400">₹{item.price}</p>
                </div>
                <button onClick={() => onDeleteDish(item.id)} className="text-red-300 hover:text-red-500 p-2">&times;</button>
              </Card>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around items-center h-16 shadow-lg z-50 max-w-md mx-auto">
         <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center flex-1 ${activeTab === 'dashboard' ? 'text-orange-500' : 'text-slate-400'}`}>
           <span className="text-[10px] font-bold">HOME</span>
         </button>
         <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center flex-1 ${activeTab === 'orders' ? 'text-orange-500' : 'text-slate-400'}`}>
           <span className="text-[10px] font-bold">ORDERS</span>
         </button>
         <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center flex-1 ${activeTab === 'menu' ? 'text-orange-500' : 'text-slate-400'}`}>
           <span className="text-[10px] font-bold">MENU</span>
         </button>
      </nav>

      {showMapModal && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0">
          <div className="w-full bg-white rounded-t-3xl p-6 pb-12 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-slate-800 tracking-tight">Delivery Pin</h3>
              <button onClick={() => setShowMapModal(null)} className="text-slate-400 text-2xl p-2">&times;</button>
            </div>
            <div id="order-view-map" className="h-72 w-full rounded-2xl bg-slate-100 mb-6 border-2 border-slate-50 shadow-inner"></div>
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6">
              <p className="font-bold text-slate-900">{showMapModal.address.houseNo}, {showMapModal.address.area}</p>
              <p className="text-sm text-slate-600">Landmark: {showMapModal.address.landmark || 'Not provided'}</p>
            </div>
            <Button variant="secondary" onClick={() => setShowMapModal(null)} className="w-full !py-4">Close Map</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerView;