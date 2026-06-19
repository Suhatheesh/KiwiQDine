// import { StatusBadge } from "../components/StatusBadge";
// import { OrderItemResponse } from "../features/orders/types";
// import { dateFormatter } from "../utils";
// import { OrderStatus, OrderType } from "../utils/constants";

// const commonColumns = [
//     {
//         key: "order_id",
//         label: "ORDER ID",
//         render: (order: OrderItemResponse) => (
//             <span className="font-mono text-sm font-medium">
//                 {order.orderNumber ?? "N/A"}
//             </span>
//         ),
//     },
//     {
//         key: "date",
//         label: "Date",
//         render: (order: OrderItemResponse) => (
//             <div>
//                 <div className="font-semibold">
//                     {dateFormatter.format(new Date(order.createdAt!))}
//                 </div>
//             </div>
//         ),
//     },
//     {
//         key: "order_status",
//         label: "Order Status",
//         render: (order: OrderItemResponse) => (
//             <StatusBadge
//                 status={order.isOnHold ? OrderStatus.HOLD : order.status ?? ""}
//                 type="order"
//             />
//         ),
//     },
//     {
//         key: "order_type",
//         label: "Order Type",
//         render: (order: OrderItemResponse) => (
//             <span className="text-sm font-medium uppercase">
//                 {order.orderType === OrderType.DINEIN ? '🍽️ Dine In' : '🥡 Take Away'}
//             </span>
//         ),
//     },
// ];

// const amountColumn = {
//     key: "amount",
//     label: "AMOUNT",
//     render: (order: OrderItemResponse) => (
//         <span className="text-sm">NZD {order.totalAmount!}</span>
//     ),
// };

// const reasonColumn = {
//     key: "reason",
//     label: "Reason",
//     render: (order: OrderItemResponse) => (
//         <span className="text-sm font-medium">
//             {order.holdReason ?? "N/A"}
//         </span>
//     ),
// };

// const orderTableData = (activeTab: "history" | "hold") => {
//     if (activeTab === "history") {
//         return [...commonColumns, amountColumn];
//     }
//     return [...commonColumns, reasonColumn, amountColumn];
// };

// export default orderTableData;
