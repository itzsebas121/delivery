export interface baseUser {
    id: string;
    nombre: string;
    email: string;
    rol: 'Client' | 'Admin' | 'Delivery';
}
export interface Client extends baseUser {
    clientId: number;
}
export interface Admin extends baseUser {
}
export interface Delivery extends baseUser {
}
export type User = Client | Admin | Delivery;