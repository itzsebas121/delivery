export interface baseUser {
    id: string;
    nombre: string;
    email: string;
    rol: 'Client' | 'Distributor' | 'Delivery';
}
export interface Client extends baseUser {
    clientId: number;
}
export interface Distributor extends baseUser {
}
export interface Delivery extends baseUser {
    deliveryId: number;
}
export type User = Client | Distributor | Delivery;