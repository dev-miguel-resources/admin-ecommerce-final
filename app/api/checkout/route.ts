import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

/*Permiten solicitudes desde cualquier origen (*).
Soportan los métodos GET, POST, PUT, DELETE, OPTIONS.
Aceptan los encabezados Content-Type y Authorization.
Esto es necesario si la API recibe peticiones desde un frontend en un dominio diferente. */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/*
Responde a solicitudes OPTIONS con los encabezados CORS.
Esto permite que los navegadores validen si pueden hacer una solicitud a esta API sin bloqueos de seguridad.
*/
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    /*Extrae cartItems y customer del cuerpo de la solicitud.
      Si faltan datos, responde con un error 400.*/
    const { cartItems, customer } = await req.json();

    // Verifica que cartItems (productos en el carrito) y customer (datos del cliente) existan.
    if (!cartItems || !customer) {
      return new NextResponse("Not enough data to checkout", { status: 400 });
    }

    // payment_method_types: ["card"] → Solo permite pagos con tarjeta.
    //mode: "payment" → Es una compra única (no suscripción).
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      // allowed_countries: ["US", "CA"] → Solo permite envíos a EE.UU. y Canadá.
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      // shipping_options → Define tarifas de envío preconfiguradas en Stripe (con shipping_rate).
      shipping_options: [
        { shipping_rate: "shr_1QonF4Klmp1I0elyltivFstq" },
        { shipping_rate: "shr_1Qon7MKlmp1I0ely6Qz2JOXw" },
      ],
      /*
        Convierte los productos del carrito (cartItems) en line_items para Stripe.
        currency: "cad | usd" → La moneda es dólares.
        unit_amount: cartItem.item.price * 100 → Stripe usa centavos, por lo que el precio se multiplica por 100.
        metadata → Guarda datos adicionales como el productId, size y color si están disponibles.
      */
      line_items: cartItems.map((cartItem: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: cartItem.item.title,
            metadata: {
              productId: cartItem.item._id,
              ...(cartItem.size && { size: cartItem.size }),
              ...(cartItem.color && { color: cartItem.color }),
            },
          },
          unit_amount: cartItem.item.price * 100,
        },
        quantity: cartItem.quantity,
      })),
      /*
        client_reference_id → Guarda el ID del cliente en Stripe.
        success_url → Redirige a esta URL después de un pago exitoso.
        cancel_url → Redirige aquí si el cliente cancela el pago.
      */
      client_reference_id: customer.clerkId,
      success_url: `${process.env.ECOMMERCE_STORE_URL}/payment_success`,
      cancel_url: `${process.env.ECOMMERCE_STORE_URL}/cart`,
    });

    return NextResponse.json(session, { headers: corsHeaders });
  } catch (err) {
    console.log("[checkout_POST]", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
