
import { Admin, Client, Delivery } from './User';

export type User =   Admin| Client | Delivery;

export function adaptarUsuario(data: any): User {
  console.log(data);
  const base = {
    id: data.userId ?? data.id ?? '',
    nombre: data.name ?? 'Sin Nombre',
    email: data.email ?? 'Sin Email',
    rol: data.RoleName ?? data.role??'Client',
  };

  switch (base.rol) {
    case 'Admin':
      return {
        ...base,
        rol: 'Admin',
      } as Admin;

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
      } as Delivery;

  }
}