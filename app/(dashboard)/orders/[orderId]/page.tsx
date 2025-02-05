import { DataTable } from '@/components/custom ui/DataTable'
import { columns } from '@/components/orderItems/OrderItemsColums'

const OrderDetails = async ({ params }: { params: { orderId: string } }) => {
  try {
    const res = await fetch(
      `${process.env.ADMIN_DASHBOARD_URL}/api/orders/${params.orderId}`,
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch order details: ${res.status}`)
    }

    const { orderDetails, customer } = await res.json()

    if (!orderDetails || !customer) {
      throw new Error('Invalid order data')
    }

    // Verificar si shippingAddress existe antes de desestructurar
    const shippingAddress = orderDetails.shippingAddress || {}

    return (
      <div className="flex flex-col p-10 gap-5">
        <p className="text-base-bold">
          Order ID: <span className="text-base-medium">{orderDetails._id}</span>
        </p>
        <p className="text-base-bold">
          Customer name:{' '}
          <span className="text-base-medium">{customer.name}</span>
        </p>
        <p className="text-base-bold">
          Shipping address:{' '}
          <span className="text-base-medium">
            {shippingAddress.street || 'N/A'}, {shippingAddress.city || 'N/A'},{' '}
            {shippingAddress.state || 'N/A'},{' '}
            {shippingAddress.postalCode || 'N/A'},{' '}
            {shippingAddress.country || 'N/A'}
          </span>
        </p>
        <p className="text-base-bold">
          Total Paid:{' '}
          <span className="text-base-medium">${orderDetails.totalAmount}</span>
        </p>
        <p className="text-base-bold">
          Shipping rate ID:{' '}
          <span className="text-base-medium">
            {orderDetails.shippingRate || 'N/A'}
          </span>
        </p>
        <DataTable
          columns={columns}
          data={orderDetails.products || []}
          searchKey="product"
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading order details:', error)
    return <p className="text-red-500">Error loading order details.</p>
  }
}

export default OrderDetails
