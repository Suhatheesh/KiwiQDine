import { Search, Star, TrendingUp } from "lucide-react";
import { FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/Button";
import ListMenuItemCard from "../components/ListMenuItemCard";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { fetchMenuItemRequest, fetchTopFeaturedItemsRequest, fetchTopSellingItemsRequest, pagination, resetPagination } from "../features/menuItems/menuItemSlice";
import { useAuth } from "../hooks/useAuth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { addItem, createAndHoldOrderRequest, createOrderRequest, increseItemQty, reduceItemQty, removeAll, removeItem, updateAddons, updateOrderRequest } from "../features/orders/ordersSlice";
import { MenuItem } from "../features/menuItems/types";
import { OrderType, PaymentMethod, QtyUpdateType } from "../utils/constants";
import { formatCurrency, hexToRgba } from "../utils";
import { RouteLinks } from "../routers/type";
import { Modal } from "../components/Modal";
import { TextArea } from "../components/TextArea";
import { VariantSelectionModal, SelectedVariant } from "../components/VariantSelectionModal";
import { CustomerSelectionModal } from "../components/CustomerSelectionModal";
import { ListMenuItemCardSkeleton } from "../components/CustomSkeleton";
import { Skeleton } from "@mui/material";
import placeholder from '../assets/placeholder.png'
import allCategory from '../assets/all_category.png'
import { OrderItemResponse, SelectedAddOn } from "../features/orders/types";
import CartOrderItemCard from "../components/CartOrderItemCard";
import { fetchCanCreateOrderRequest } from "../features/subscriptions/subscriptionsSlice";
import { fetchAllCategoryRequest } from "../features/category/categorySlice";
import useAllItemCount from "../hooks/useAllItemCount";

const MenuList: FC = () => {

    const { table, tableId, orderType, type } = useParams();
    const location = useLocation();
    const navigation = useNavigate();
    const { count } = useAllItemCount();

    const order = (location.state as { order?: OrderItemResponse } | null)?.order;

    const [searchTerm, setSearchTerm] = useState('');
    const [selectCategoryId, setSelectCategoryId] = useState<string>('');
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [holdReason, setHoldReason] = useState('');
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerPhone, setCustomerPhone] = useState<string>('');
    const [customerName, setCustomerName] = useState<string>('');
    const [proceedType, setProceedType] = useState<'hold' | 'create'>('create');
    const [itemSelectedAddOns, setItemSelectedAddOns] = useState<SelectedAddOn[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const menuListRef = useRef<HTMLDivElement>(null);
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const { user, primaryColor } = useAuth();
    const dispatch = useDispatch<AppDispatch>();

    const { data: menu, totalPages, page, isPaginationFetching, loading: menuLoading } = useSelector((state: RootState) => state.menu);
    const { categoies } = useSelector((state: RootState) => state.category);
    const { cartItem, loading, error, isOrderCreated } = useSelector((state: RootState) => state.orders);

    const { canCreateOrder } = useSelector((state: RootState) => state.subscription);

    const restructureCategory = categoies.map((i) => ({ value: i.id, label: i.name, image: i.image ?? '', itemCount: i.itemCount }));

    const validateToast = useCallback(() => {
        if (isOrderCreated || error) {
            navigation(RouteLinks.ORDERS, { replace: true })
        }
    }, [error, navigation, isOrderCreated]);

    useLayoutEffect(() => {
        validateToast();
    }, [validateToast])

    useLayoutEffect(() => {
        dispatch(fetchAllCategoryRequest());
        dispatch(fetchCanCreateOrderRequest(user?.restaurantId!))
        initializeOrderToCart();
    }, [order, dispatch])

    useLayoutEffect(() => {
        if (selectCategoryId === 'featured') {
            dispatch(fetchTopFeaturedItemsRequest(user?.restaurantId!))
        } else if (selectCategoryId === 'top-selling') {
            dispatch(fetchTopSellingItemsRequest(user?.restaurantId!))
        } else {
            dispatch(fetchMenuItemRequest({ restaurantId: user?.restaurantId!, page: String(page), limit: "20", search: searchTerm, categoryId: selectCategoryId }))
        }
        return () => {
            dispatch(removeAll())
        };
    }, [dispatch, user, page, selectCategoryId, searchTerm])

    useLayoutEffect(() => {
        return () => {
            dispatch(resetPagination());
        }
    }, [])

    const initializeOrderToCart = () => {
        if (order) {
            setCustomerName(order.customerName ?? "");
            order.itemsByCategory?.forEach((i) => {
                i.items.forEach((y) => {
                    dispatch(addItem({
                        item: {
                            id: y.menuId,
                            name: y.menuName,
                            discount: 0,
                            restaurantId: order.restaurant?.id ?? "",
                            price: Number(y.unitPrice),

                        },
                        quantity: y.quantity,
                        selectedVariants: y.specialInstructions?.portion ? [
                            {
                                variantName: "Size",
                                options: [
                                    {
                                        name: y.specialInstructions?.portion ?? '',
                                        price: 0
                                    }
                                ]
                            }
                        ] : [],
                        selectedAddOns: y.addons?.map((i) => ({
                            addonId: i.addonId,
                            addonName: i.name ?? "",
                            totalPrice: Number(i.totalPrice),
                            unitPrice: Number(i.unitPrice),
                            id: i.id,
                            quantity: i.quantity,
                        }))
                    }));
                })
            })
        }
    }

    const handdleAddItem = (item: MenuItem) => {
        setItemSelectedAddOns([]);
        setSelectedIndex(-1);
        if (item.variantOptions && item.variantOptions.length > 0) {
            setSelectedItem(item);
            setIsVariantModalOpen(true);
        } else {
            dispatch(addItem({ item }));
        }
    }

    const handleVariantConfirm = (item: MenuItem, quantity: number, selectedVariants: SelectedVariant[], selectedAddOns: SelectedAddOn[]) => {
        if (itemSelectedAddOns.length > 0) {
            dispatch(updateAddons({ index: selectedIndex, selectedAddOns }));
        } else {
            dispatch(addItem({ item, selectedVariants, quantity, selectedAddOns }));
        }

    }

    const handleIncreaseQty = (type: QtyUpdateType, index: number) => {
        if (type === QtyUpdateType.INCREASE) {
            dispatch(increseItemQty(index))
        } else {
            dispatch(reduceItemQty(index))
        }
    }

    const handleDeleteItem = (index: number) => {
        dispatch(removeItem(index))
    }

    const handleProceedClick = (type: 'hold' | 'create') => {
        if (!order) {
            setProceedType(type);
            setIsCustomerModalOpen(true);
        } else {
            handleUpdateOrder();
        }
    }

    const handleUpdateOrder = () => {
        dispatch(updateOrderRequest({
            confirm: type === 'confirm',
            orderId: order?.id ?? '',
            orderItems: {
                orderItems: cartItem.map((i) => ({
                    menuId: i.item.id,
                    quantity: i.qty,
                    specialInstructions: {
                        portion: i.selectedVariants?.find((v) => v.variantName === "Size")?.options[0].name
                    },
                    selectedAddons: i.selectedAddOns?.map((a) => ({
                        addonId: a.addonId,
                        quantity: a.quantity,
                    }))
                })),
                paymentMethod: PaymentMethod.CASHIER,
            }
        }))
    }

    const handlePhoneSubmit = (phoneNumber: string, name: string) => {
        setCustomerPhone(phoneNumber);
        setCustomerName(name);
        if (proceedType === 'hold') {
            handleHoldOrder();
            return;
        }
        const base = {
            restaurantId: user?.restaurantId,
            customerName: name,
            phone: phoneNumber.charAt(0) === '0' ? `+64${phoneNumber.slice(1)}` : phoneNumber,
            orderItems: cartItem.map((i) => ({
                menuId: i.item.id,
                quantity: i.qty,
                specialInstructions: {
                    portion: i.selectedVariants?.find((v) => v.variantName === "Size")?.options[0].name
                },
                selectedAddons: i.selectedAddOns?.map((a) => ({
                    addonId: a.addonId,
                    quantity: a.quantity,
                }))
            })),
            paymentMethod: PaymentMethod.CASHIER,
            orderType: orderType,
            restaurantType: user?.tenant?.type
        }

        const orderRequest = orderType === OrderType.TAKEAWAY ? base : {
            ...base,
            tableId,
            tableNo: table,
        }
        dispatch(createOrderRequest(orderRequest))
        setIsCustomerModalOpen(false);
    }

    const handleHoldOrder = () => {
        setIsHoldModalOpen(true);
    }

    const confirmHoldOrder = () => {
        dispatch(createAndHoldOrderRequest({
            restaurantId: user?.restaurantId,
            customerName: customerName,
            phone: customerPhone.charAt(0) === '0' ? `+64${customerPhone.slice(1)}` : customerPhone,
            tableNo: table,
            orderItems: cartItem.map((i) => ({
                menuId: i.item.id,
                quantity: i.qty,
                specialInstructions: {
                    portion: i.selectedVariants?.find((v) => v.variantName === "Size")?.options[0].name
                },
                selectedAddons: i.selectedAddOns?.map((a) => ({
                    addonId: a.addonId,
                    quantity: a.quantity,
                }))
            })),
            tableId,
            reason: holdReason,
            updatedBy: user?.id ?? "",
            paymentMethod: PaymentMethod.CASHIER,
            orderType: orderType ?? OrderType.DINEIN,
            restaurantType: user?.tenant?.type
        }));
        setIsHoldModalOpen(false);
        setHoldReason('');
    }

    const filterMenuItem = useMemo(() => {
        return menu.filter((item) => {
            const matchCategory = !selectCategoryId ||
                selectCategoryId === 'featured' ||
                selectCategoryId === 'top-selling' ||
                item.category?.id === selectCategoryId;

            return matchCategory && item.isAvailable;
        });
    }, [menu, selectCategoryId]);

    const totalPrices: { subTotal: number, grandTotal: number, discount: number } = useMemo(() => {
        const subTotal = cartItem.reduce((prev, cur) => {
            let totalOptionsPrice = 0;
            cur.selectedVariants?.forEach(variant => {
                variant.options.forEach(option => {
                    if (option.price) {
                        totalOptionsPrice += Number(option.price);
                    }
                });
            });
            const unitPrice = totalOptionsPrice > 0 ? totalOptionsPrice : Number(cur.item.price);
            return prev + (unitPrice * cur.qty);
        }, 0);

        const addOnsTotal = cartItem.reduce((prev, cur) => {
            let totalOptionsPrice = 0;
            cur.selectedAddOns?.forEach(addOn => {
                if (addOn.unitPrice) {
                    totalOptionsPrice += Number(addOn.unitPrice);
                }
            });
            return prev + (totalOptionsPrice * cur.qty);
        }, 0);

        const grandTotal = cartItem.reduce((prev, cur) => prev + Number(cur.total), 0);

        return {
            subTotal: subTotal + addOnsTotal,
            grandTotal,
            discount: (subTotal + addOnsTotal) - grandTotal
        }
    }, [cartItem])

    const selectedMap = useMemo(() => {
        const map = new Map<string, boolean>();
        cartItem.forEach(i => map.set(i.item.id!, true));
        return map;
    }, [cartItem]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!categoryScrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
        setScrollLeft(categoryScrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !categoryScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - categoryScrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast
        categoryScrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleScroll = () => {
        if (menuListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;

            if (scrollTop + clientHeight >= scrollHeight - 50) {
                handlePageChange();
            }
        }
    }

    const handlePageChange = () => {
        if (totalPages <= Number(page) || isPaginationFetching) return;
        dispatch(pagination(String(Number(page) + 1)))
    }

    const handleClick = (index: number, item: MenuItem, selectedAddOns?: SelectedAddOn[]) => {
        if (!selectedAddOns || selectedAddOns.length === 0) return;
        setIsVariantModalOpen(true)
        setItemSelectedAddOns(selectedAddOns);
        setSelectedItem(item);
        setSelectedIndex(index);
    }

    return (
        <div className="flex">
            <div className='grid grid-cols-[2fr_1fr] gap-5'>

                {/* Menu Item Section  */}

                <div className="space-y-2">

                    <div className="flex flex-col bg-white p-4 shadow rounded-lg">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by invoice number or restaurant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={(e) => (e.target.style.boxShadow = `0 0 0 1px ${primaryColor}`)}
                                onBlur={(e) => (e.target.style.boxShadow = "none")}
                                className="w-full bg-white pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Categories */}

                    <div
                        ref={categoryScrollRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        className="flex py-2.5 w-[calc(100vw-700px)]  gap-3 overflow-x-scroll px-4 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none"
                    >
                        {menuLoading && menu.length === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    variant="rectangular"
                                    width={140}
                                    height={44}
                                    className="rounded-xl shrink-0"
                                />
                            ))
                        ) : (
                            <>
                                {[
                                    { value: '', label: 'All Items', image: allCategory, itemCount: count },
                                    { value: 'featured', label: 'Featured', icon: Star, itemCount: 0 },
                                    { value: 'top-selling', label: 'Top Selling', icon: TrendingUp, itemCount: 0 },
                                    ...restructureCategory
                                ].map((item, index) => {
                                    const isActive = selectCategoryId === item.value;

                                    const Icon = 'icon' in item ? item.icon : null;

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                setSearchTerm('')
                                                setSelectCategoryId(item.value);
                                                dispatch(resetPagination());
                                            }}
                                            style={{ background: isActive ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                                            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                                        transition-all duration-300 ease-in-out shrink-0
                                        ${isActive
                                                    ? 'text-white shadow-lg shadow-blue-200 scale-105'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                                                }
                                    `}
                                        >
                                            {Icon ? (
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                            ) : (
                                                <img src={('image' in item ? item.image : null) || placeholder} className="h-5 w-5 object-cover rounded-full" />
                                            )}
                                            <span className="whitespace-nowrap">{item.label}</span>
                                            {item.value === 'featured' || item.value === 'top-selling' ? null : <span className={`
                                            px-2 py-0.5 rounded-full text-xs font-bold
                                            transition-all duration-300
                                            ${isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                                }
                                        `}>
                                                {item.itemCount}
                                            </span>}
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    {/* Menu Item List */}

                    <div className="h-[calc(100vh-240px)] w-[calc(100vw-700px)]
                                    grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 grid-flow-row 
                                    gap-2.5 auto-rows-max
                                    overflow-y-scroll border-y border-gray-200 py-5 px-2" ref={menuListRef} onScroll={handleScroll}>
                        {menuLoading && menu.length === 0 ? (
                            Array.from({ length: 15 }).map((_, i) => (
                                <ListMenuItemCardSkeleton key={i} />
                            ))
                        ) : (
                            filterMenuItem.map((item, i) => {
                                const isSelected = selectedMap.has(item.id ?? "");
                                return <ListMenuItemCard
                                    key={i}
                                    item={item}
                                    selected={isSelected}
                                    onClick={handdleAddItem} />
                            })
                        )}
                    </div>

                </div>

                {/* Order Detail Section*/}

                <div>
                    <div className='bg-white flex rounded-xl'>
                        <div className='flex flex-1 flex-col p-4'>

                            <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                                <div>
                                    <p className='font-semibold text-xl'>New Order</p>
                                    <div className='flex justify-between text-sm font-light text-gray-400 '>
                                        <p>Add item to the order</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {customerName && (
                                        <div className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold flex items-center space-x-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>{customerName}</span>
                                        </div>
                                    )}
                                    {customerPhone && (
                                        <div className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span>{customerPhone}</span>
                                        </div>
                                    )}
                                    {(order || table) && (
                                        <div style={{ background: primaryColor }} className="w-fit h-fit px-4 py-3 rounded-xl text-white font-bold">
                                            <p>{order ? order.tableNo : table}</p>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className='h-[calc(100vh-400px)] overflow-y-scroll px-2 mt-3'>
                                {cartItem.map(({ item, qty, total, selectedVariants, selectedAddOns }, index) => (
                                    <CartOrderItemCard
                                        key={index}
                                        item={item}
                                        index={index}
                                        qty={qty}
                                        total={total}
                                        handleIncreaseQty={handleIncreaseQty}
                                        handleDeleteItem={handleDeleteItem}
                                        selectedVariants={selectedVariants}
                                        selectedAddOns={selectedAddOns}
                                        primaryColor={primaryColor}
                                        onClick={(item: MenuItem, selectedAddOns?: SelectedAddOn[]) => handleClick(index, item, selectedAddOns)}
                                    />
                                ))}
                            </div>
                            <div className='space-y-2 pt-5'>
                                <div className='flex justify-between items-center text-xs font-bold'>
                                    <p className='text-gray-400 uppercase tracking-widest'>Subtotal</p>
                                    <p className='text-gray-900'>{formatCurrency(totalPrices.grandTotal)}</p>
                                </div>
                                <div className='flex justify-between items-center text-xs font-bold pb-3.5'>
                                    <p className='text-gray-400 uppercase tracking-widest'>Tax & Fees</p>
                                    <p className='text-gray-900'>NZD 0.00</p>
                                </div>
                                <div className="pt-2 border-t border-dashed border-gray-200" />
                                <div className='flex justify-between text-xl'>
                                    <p className='font-bold'>Grand Total</p>
                                    <p className='font-bold'>{formatCurrency(totalPrices.grandTotal)}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className='space-y-2 flex flex-col mt-3 px-2'>

                        <div className="flex flex-1 justify-between space-x-2 mt-2 ">
                            {!order && <Button disabled={!canCreateOrder?.allowed} size='lg' variant="secondary" className='flex flex-1 text-gray-500' onClick={() => handleProceedClick('hold')}>
                                <p>Hold Cart</p>
                            </Button>}
                            <Button disabled={!canCreateOrder?.allowed} isLoading={loading} size='lg' className='flex flex-1 text-white bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' onClick={() => handleProceedClick('create')}>
                                <p>Proceed</p>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isHoldModalOpen}
                onClose={() => setIsHoldModalOpen(false)}
                title="Hold Order"
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsHoldModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button isLoading={loading} onClick={confirmHoldOrder}>
                            Confirm Hold
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-600">Please provide a reason for holding this order.</p>
                    <TextArea
                        label="Reason"
                        placeholder="e.g., Waiting for customer confirmation"
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}

                    />
                </div>
            </Modal>

            <VariantSelectionModal
                isOpen={isVariantModalOpen}
                initailSelectedAddOns={itemSelectedAddOns}
                item={selectedItem}
                onClose={() => setIsVariantModalOpen(false)}
                onConfirm={handleVariantConfirm}
            />

            <CustomerSelectionModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onPhoneSubmit={handlePhoneSubmit}
            />
        </div>
    )
}

export default MenuList;