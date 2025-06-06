
import { Distributor, Client, Delivery } from './User';

export type User =   Distributor| Client | Delivery;

export function adaptarUsuario(data: any): User {
  const base = {
    id: data.userId ?? data.id ?? '',
    nombre: data.name ?? 'Sin Nombre',
    email: data.email ?? 'Sin Email',
    rol: data.RoleName ?? data.role??'',
  };

  switch (base.rol) {
    case 'Distributor':
      return {
        ...base,
        rol: 'Distributor',
      } as Distributor;

    case 'Client':
      return {
        ...base,
        rol: 'Client',
        clientId: data.clientID ?? 0, 
      } as Client;
    case 'Delivery':
      default:
      return {
        ...base,
        rol: 'Delivery',
        deliveryId: data.deliveryID ?? 0,
      } as Delivery;

  }
}