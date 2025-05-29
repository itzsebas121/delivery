import { jwtDecode } from "jwt-decode";
export function HomeDeliveryPerson(){
    const token = localStorage.getItem("token") || "";
    const decodedToken = jwtDecode(token);
    console.log(decodedToken)
    return (
        <h1> Home delivery Person</h1>
    );
}