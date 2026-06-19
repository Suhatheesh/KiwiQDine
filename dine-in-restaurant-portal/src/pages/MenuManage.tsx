import { Plus } from "lucide-react";
import { FC, useCallback, useLayoutEffect, useState } from "react";
import { Button } from "../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { createMenuItemRequest, deleteMenuItemRequest, fetchBadgesRequest, fetchMenuItemLessWeightRequest, fetchMenuItemRequest, menuItemAvailabilityRequest, pagination, resetMenuItem, resetPagination, updateMenuItemRequest, uploadMenuItemImageRequest } from "../features/menuItems/menuItemSlice";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/Modal";
import { CreateMenuItemRequest, MenuItem, OptionType } from "../features/menuItems/types";
import { SubmitHandler, useForm } from "react-hook-form";
import { TabType, UserRole } from "../utils/constants";
import MenuSection from "../sections/MenuManage/MenuItemSection";
import MenuModelSection from "../sections/Model/Menu/MenuModelSection";
import CategorySection from "../sections/MenuManage/CategorySection";
import { createCategoryRequest, deleteCategoryRequest, fetchAllCategoryRequest, reorderCategoriesRequest, resetImage, updateCategoryRequest, uploadCategoryImageRequest } from "../features/category/categorySlice";
import CategoryModelSection from "../sections/Model/Menu/CategoryModelSection";
import { Category, CategoryRequest } from "../features/category/types";
import { fileToBase64 } from "../utils";
import AddOnSection from "../sections/MenuManage/AddOnSection";
import AddOnModelSection from "../sections/Model/Menu/AddOnModelSection";
import { CreateAddOnRequest, AddOn } from "../features/addOns/types";
import { createAddOnRequest, deleteAddOnRequest, fetchAllAddOnRequest, resetAddOn, updateAddOnRequest } from "../features/addOns/addOnSlice";
import BadgeSection from "../sections/MenuManage/BadgeSection";
import BadgeLinkModelSection from "../sections/Model/Menu/BadgeLinkModelSection";
import { Badge } from "../features/menuItems/types";
import { attachBadgesRequest } from "../features/menuItems/menuItemSlice";
import TabHeader from "../components/menu_manager/TabHeader";
import CategoryReorderModal from "../sections/Model/Menu/CategoryReorderModal";
import useAllItemCount from "../hooks/useAllItemCount";

const MenuManage: FC = () => {
    const { count } = useAllItemCount();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectCategoryId, setSelectCategoryId] = useState<string>('');
    const [selectedTab, setSelectedTab] = useState<TabType>(TabType.MENUITEM)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string[]>([])
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [varientInput, setVarientInput] = useState<OptionType[]>([])
    const [availabilityConfirm, setAvailabilityConfirm] = useState<{ value: boolean, menuId: string } | null>(null)
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
    const [selectedBadgeForLink, setSelectedBadgeForLink] = useState<Badge | null>(null);
    const [selectedItemIdsForLink, setSelectedItemIdsForLink] = useState<string[]>([]);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [searchMenuItem, setSearchMenuItem] = useState("");
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

    const { user, primaryColor } = useAuth();
    const dispatch = useDispatch<AppDispatch>();
    const userRole = user?.role;

    const { data: menu, image, isCreateMenuItem, isUpdateMenuItem, isDeleteMenuItem, loading, imageLoading, totalPages, page, isPaginationFetching, menuItemsLessWeight, badges } = useSelector((state: RootState) => state.menu)

    const { categoies, image: categoryImage, loading: categoryLoading, isCreateCategory, isUpdateCategory, error: categoryError, isDeleteCategory, imageLoading: categoryImageLoading } = useSelector((state: RootState) => state.category);

    const { data: addOns, loading: addOnLoading, isCreateAddOn, isUpdateAddOn, isDeleteAddOn, error: addOnError } = useSelector((state: RootState) => state.addOn);

    const restructureCategory = categoies.map((i) => ({ value: i.id, label: i.name, image: i.image ?? '', itemCount: i.itemCount }));
    const restructureBadges = badges.map((b) => ({ value: b.code, label: b.name, backgroundColor: b.backgroundColor, textColor: b.textColor }));

    const { register, handleSubmit: menuHandleSubmit, reset, watch, control } = useForm<CreateMenuItemRequest>({
        defaultValues: {
            name: "",
            description: "",
            image: "",
            price: 0,
            preparationTime: 0,
            quantityAvailable: 0,
            categoryId: "",
            note: "",
            restaurantId: "",
            isAvailable: true,
            isFeatured: false,
            featuredOrder: 0,
            badges: []
        },
    });

    const { register: categoryRegister, handleSubmit: categoryHandleSubmit, reset: categoryReset, watch: categoryWatch } = useForm<CategoryRequest>({
        defaultValues: {
            name: "",
            description: ""
        },
    });

    const { register: addOnRegister, handleSubmit: addOnHandleSubmit, reset: addOnReset, watch: addOnWatch, control: addOnControl } = useForm<CreateAddOnRequest>({
        defaultValues: {
            name: "",
            description: "",
            unitPrice: 0,
            quantity: 0,
            menuIds: []
        }
    });

    const validateToast = useCallback(() => {
        if (isCreateMenuItem || isDeleteMenuItem || isUpdateMenuItem || isCreateCategory || isUpdateCategory || categoryError || isDeleteCategory || isCreateAddOn || isUpdateAddOn || isDeleteAddOn || addOnError) {
            handleCloseModal();
        }
    }, [isCreateMenuItem, isDeleteMenuItem, isUpdateMenuItem, isCreateCategory, categoryError, isDeleteCategory, isUpdateCategory, isCreateAddOn, isUpdateAddOn, isDeleteAddOn, addOnError]);

    useLayoutEffect(() => {
        if (categoies.length === 0) {
            setSelectedTab(TabType.CATEGORY)
        }
    }, [categoies])

    useLayoutEffect(() => {
        validateToast();
    }, [validateToast])

    useLayoutEffect(() => {
        dispatch(fetchBadgesRequest(user!.restaurantId!))
        dispatch(fetchAllAddOnRequest(user!.restaurantId!))
        dispatch(fetchAllCategoryRequest())
    }, [dispatch, user])

    useLayoutEffect(() => {
        dispatch(fetchMenuItemRequest({ restaurantId: user!.restaurantId!, page, limit: "20", search: searchMenuItem, categoryId: selectCategoryId }))
    }, [dispatch, page, searchMenuItem, selectCategoryId])

    useLayoutEffect(() => {
        if (selectedTab === TabType.ADDON || selectedTab === TabType.BADGES) {
            dispatch(fetchMenuItemLessWeightRequest({ restaurantId: user?.restaurantId!, search: searchMenuItem }))
        }
    }, [dispatch, selectedTab, searchMenuItem])

    useLayoutEffect(() => {
        return () => {
            dispatch(resetPagination());
        }
    }, [])

    const handlePageChange = () => {
        if (totalPages <= Number(page) || isPaginationFetching) return;
        dispatch(pagination(String(Number(page) + 1)))
    }

    const handleAdd = () => {
        setIsModalOpen(true);
        reset({
            name: "",
            description: "",
            image: "",
            categoryId: "",
            note: "",
            restaurantId: "",
            isAvailable: true,
            isFeatured: false,
            featuredOrder: 0,
            badges: []
        });
        dispatch(resetMenuItem());
        dispatch(resetImage());
        categoryReset();
        addOnReset({ name: "" });
        dispatch(resetAddOn());
        setSelectedAddOn(null);
    }

    const handleCategoryTypeClick = (type: TabType) => {
        setSearchMenuItem("")
        setSelectedTab(type);
        setSelectedCategoryId([])
    }

    const hanldeCategory = (id: string) => {
        dispatch(resetPagination());
        setSelectCategoryId(id)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false)
        setIsLinkModalOpen(false);
        setSelectedItem(null);
        setSelectedCategory(null);
        setSelectedAddOn(null);
        setSelectedItemIdsForLink([]);
        setSelectedBadgeForLink(null);
        setAvailabilityConfirm(null);
        setIsReorderModalOpen(false);
    }

    const handleMenuItemEdit = (item: MenuItem) => {
        setIsModalOpen(true);
        setSelectedItem(item);
        dispatch(resetMenuItem());
    }

    const handleCategoryEdit = (category: Category) => {
        setIsModalOpen(true);
        setSelectedCategory(category);
        categoryReset({
            name: category.name,
            description: category.description || "",
            image: category.image || "",
            restaurantId: user?.restaurantId || ""
        });
    }

    const handleAddOnEdit = (addOn: AddOn) => {
        setIsModalOpen(true);
        setSelectedAddOn(addOn);
        addOnReset({
            name: addOn.name,
            description: addOn.description || "",
            unitPrice: addOn.unitPrice,
            quantity: addOn.quantity,
            restaurantId: user?.restaurantId || "",
            menuIds: addOn.menus.map((menu) => menu.id)
        });
    }

    const handleLinkItems = (badge: Badge) => {
        setSelectedBadgeForLink(badge);
        const initialSelected = menu.filter(item =>
            item.badges?.map(b => b.code).includes(badge.code) || item.badges?.map(b => b.id).includes(badge.id)
        ).map(item => item.id!);

        setSelectedItemIdsForLink(initialSelected);
        setIsLinkModalOpen(true);
    }

    const handleSubmit = () => {
        if (selectedTab === TabType.MENUITEM) {
            menuHandleSubmit(handleCreateMenuItem)()
        } else if (selectedTab === TabType.CATEGORY) {
            categoryHandleSubmit(handleCreateCategory)()
        } else {
            addOnHandleSubmit(handleCreateAddOn)()
        }
    }

    const handleCreateCategory: SubmitHandler<CategoryRequest> = (data) => {
        if (selectedCategory) {
            dispatch(updateCategoryRequest({ ...data, id: selectedCategory.id, restaurantId: user!.restaurantId!, image: categoryImage?.url ?? selectedCategory.image ?? "" }))
        } else {
            dispatch(createCategoryRequest({ ...data, restaurantId: user!.restaurantId!, image: categoryImage?.url ?? "" }))
        }
        reset();
    }

    const handleReorderSave = (reorderedCategories: Category[]) => {
        const payload = reorderedCategories.map((cat, index) => ({
            id: cat.id,
            displayOrder: index + 1
        }));
        dispatch(reorderCategoriesRequest({ restaurantId: user!.restaurantId!, categories: payload }));
        setIsReorderModalOpen(false);
    }

    const handleCreateAddOn: SubmitHandler<CreateAddOnRequest> = (data) => {
        if (selectedAddOn) {
            dispatch(updateAddOnRequest({ ...data, id: selectedAddOn.id, restaurantId: user!.restaurantId!, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice) }));
        } else {
            dispatch(createAddOnRequest({ ...data, restaurantId: user!.restaurantId!, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice) }));
        }
        addOnReset();
    }

    const handleBulkLinkBadges = () => {
        if (!selectedBadgeForLink) return;
        menu.forEach(item => {
            const isCurrentlySelected = selectedItemIdsForLink.includes(item.id!);
            const hasBadge = item.badges?.some(b => b.code === selectedBadgeForLink.code || b.id === selectedBadgeForLink.id);

            if (isCurrentlySelected && !hasBadge) {
                const newBadges = [...(item.badges?.map(b => b.code) || []), selectedBadgeForLink.code];
                dispatch(attachBadgesRequest({ menuId: item.id!, badges: newBadges, isFeatured: item.isFeatured || false, featuredOrder: item.featuredOrder || 0 }));
            } else if (!isCurrentlySelected && hasBadge) {
                const newBadges = (item.badges?.map(b => b.code) || []).filter(b => b !== selectedBadgeForLink.code && b !== selectedBadgeForLink.id);
                dispatch(attachBadgesRequest({ menuId: item.id!, badges: newBadges, isFeatured: item.isFeatured || false, featuredOrder: item.featuredOrder || 0 }));
            }
        });
        handleCloseModal();
    }

    const handleIsfeaturedChange = (data: CreateMenuItemRequest, menuId: string) => {
        dispatch(attachBadgesRequest({ menuId: menuId, badges: data.badges as string[] ?? [], isFeatured: data.isFeatured || false, featuredOrder: data.featuredOrder || 0 }));
    }

    const handleCreateMenuItem: SubmitHandler<CreateMenuItemRequest> = useCallback((data) => {
        const body: CreateMenuItemRequest = {
            ...data,
            price: Number(data.price),
            discount: data.discount ? Number(data.discount) : undefined,
            preparationTime: data.preparationTime ? Number(data.preparationTime) : undefined,
            quantityAvailable: data.quantityAvailable ? Number(data.quantityAvailable) : undefined,
            featuredOrder: data.featuredOrder ? Number(data.featuredOrder) : undefined,
            restaurantId: user!.restaurantId!,
            image: image?.url,
            variantOptions: [
                {
                    name: "Size",
                    type: 'single',
                    options: varientInput
                }
            ]
        };

        if (selectedItem) {
            dispatch(updateMenuItemRequest(body))
            handleIsfeaturedChange(data, selectedItem.id!);
        } else {
            dispatch(createMenuItemRequest(body));
        }
    }, [dispatch, selectedItem, user, varientInput, image])

    const handleCategoryCheck = (id: string) => {
        setSelectedCategoryId(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    }

    const handleeDeleteConfirm = useCallback((itemId: string) => {
        setSelectedItemId(itemId)
        handleDeleteModel();
    }, [])

    const handleAddOnDeleteConfirm = (id: string) => {
        setSelectedItemId(id);
        handleDeleteModel();
    }

    const handleDeleteModel = () => {
        setIsDeleteModalOpen(true)
    }

    const handleDelete = () => {
        if (selectedTab === TabType.MENUITEM) {
            dispatch(deleteMenuItemRequest(selectedItemId ?? ""))
        } else if (selectedTab === TabType.CATEGORY) {
            dispatch(deleteCategoryRequest(selectedCategoryId))
            setSelectedCategoryId([]);
        } else {
            dispatch(deleteAddOnRequest(selectedItemId ?? ""));
        }
    }

    const handleVariantOption = (values: OptionType[]) => {
        setVarientInput(values)
    }

    const handleAvailability = (value: boolean, menuId: string) => {
        setAvailabilityConfirm({ value, menuId })
    }

    const handleAvailabilityUpdateConfirm = () => {
        if (availabilityConfirm) {
            dispatch(menuItemAvailabilityRequest({ menuId: availabilityConfirm.menuId, restaurantId: user?.restaurantId ?? "", value: availabilityConfirm.value }))
        }
    }

    const handleImageUpload = async (file: File | null) => {
        if (file && user && user.restaurantId) {
            const base64 = await fileToBase64(file);
            dispatch(uploadMenuItemImageRequest({ restaurantId: user.restaurantId, image: base64 }));
        }
    };

    const handleCategoryImageUpload = async (file: File | null) => {
        if (file && user && user.restaurantId) {
            const base64 = await fileToBase64(file);
            dispatch(uploadCategoryImageRequest({ restaurantId: user.restaurantId, image: base64 }));
        }
    };

    const disableSubmit = (!watch('name') || !watch('description') || !watch('categoryId') || !watch('price') || !watch('preparationTime') || !watch('quantityAvailable')) && selectedTab === TabType.MENUITEM

    const disableCategorySubmit = (!categoryWatch('name') || !categoryWatch('description')) && selectedTab === TabType.CATEGORY

    const disableAddOnSubmit = (!addOnWatch('name') || !addOnWatch('description') || !addOnWatch('unitPrice')) && selectedTab === TabType.ADDON

    return (
        <div className="space-y-6">
            {/* Enhanced Tab Navigation with Add Button */}
            <div className="bg-white rounded-2xl shadow-md p-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <TabHeader
                        selectedTab={selectedTab}
                        handleCategoryTypeClick={handleCategoryTypeClick}
                        menuItemCount={count}
                        categoies={categoies}
                        addOns={addOns}
                        badges={badges}
                        primaryColor={primaryColor}
                    />
                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                        {selectedCategoryId.length > 0 && (userRole !== UserRole.WAITER && userRole !== UserRole.KITCHEN_STAFF) && (
                            <Button
                                variant="ghost"
                                onClick={handleDeleteModel}
                                isLoading={categoryLoading}
                            >
                                Remove ({selectedCategoryId.length})
                            </Button>
                        )}
                        {selectedTab === TabType.CATEGORY && userRole !== UserRole.WAITER && userRole !== UserRole.KITCHEN_STAFF && (
                            <Button
                                variant="ghost"
                                onClick={() => setIsReorderModalOpen(true)}
                                className="border-gray-200"
                            >
                                Reorder
                            </Button>
                        )}
                        {selectedTab !== TabType.BADGES && userRole !== UserRole.WAITER && userRole !== UserRole.KITCHEN_STAFF && (
                            <Button
                                onClick={handleAdd}
                                className="text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full md:w-auto"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {selectedTab === TabType.CATEGORY ? 'Add Category' : selectedTab === TabType.ADDON ? 'Add Add-on' : 'Add Item'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {selectedTab === TabType.MENUITEM ? (
                <MenuSection
                    categoryId={selectCategoryId}
                    categoryList={restructureCategory}
                    reset={reset}
                    onEdit={handleMenuItemEdit}
                    onDelete={handleeDeleteConfirm}
                    onCategoryClick={hanldeCategory}
                    onAvailability={handleAvailability}
                    onScrollPagination={handlePageChange}
                    onSearch={(search) => setSearchMenuItem(search)}
                />
            ) : selectedTab === TabType.CATEGORY ? (
                <CategorySection
                    dataList={categoies}
                    itemList={menu}
                    checkList={selectedCategoryId}
                    allowedRoles={[UserRole.MANAGER, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]}
                    onClick={handleCategoryCheck}
                    onEdit={handleCategoryEdit}
                    loading={categoryLoading}
                />
            ) : selectedTab === TabType.ADDON ? (
                <AddOnSection
                    dataList={addOns}
                    loading={addOnLoading}
                    onEdit={handleAddOnEdit}
                    onDelete={handleAddOnDeleteConfirm}
                />
            ) : (
                <BadgeSection
                    dataList={badges}
                    loading={loading}
                    onLinkItems={handleLinkItems}
                // onEdit={...}
                // onDelete={...}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedItem ? 'Edit Menu Item' : selectedCategory ? 'Edit Category' : selectedAddOn ? 'Edit Add-on' : `${selectedTab === TabType.MENUITEM ? 'Add Menu Item' : selectedTab === TabType.CATEGORY ? 'Add Category' : 'Add Add-on'}`}
                size={selectedTab === TabType.MENUITEM ? "lg" : "sm"}
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button isLoading={loading || categoryLoading || imageLoading || categoryImageLoading || addOnLoading} onClick={handleSubmit} disabled={selectedTab === TabType.MENUITEM ? disableSubmit : selectedTab === TabType.CATEGORY ? disableCategorySubmit : disableAddOnSubmit}>
                            {selectedItem || selectedCategory || selectedAddOn ? 'Save Changes' : `${selectedTab === TabType.MENUITEM ? 'Create Item' : selectedTab === TabType.CATEGORY ? 'Create Category' : 'Create Add-on'}`}
                        </Button>
                    </div>
                }
            >
                {selectedTab === TabType.MENUITEM ? (
                    <MenuModelSection
                        type={selectedItem ? 'edit' : 'create'}
                        categoryList={restructureCategory}
                        register={register}
                        watch={watch}
                        control={control}
                        onChange={handleVariantOption}
                        onImageUpload={handleImageUpload}
                        badgeList={restructureBadges}
                    />
                ) : selectedTab === TabType.CATEGORY ? (
                    <CategoryModelSection
                        register={categoryRegister}
                        watch={categoryWatch}
                        onImageUpload={handleCategoryImageUpload}
                    />
                ) : (
                    <AddOnModelSection
                        type={selectedAddOn ? 'edit' : 'create'}
                        categoryList={menuItemsLessWeight.map(m => ({ value: m.menuItemId, label: m.menuName }))}
                        register={addOnRegister}
                        watch={addOnWatch}
                        control={addOnControl}
                        searchMenu={setSearchMenuItem}
                    />
                )}

            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseModal}
                title={`Delete ${selectedTab === TabType.CATEGORY ? 'Categories' : selectedTab === TabType.ADDON ? 'Add-on' : 'Menu Item'}`}
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={loading}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">This action cannot be undone.</p>
                    <p>The {selectedTab === TabType.CATEGORY ? 'category' : selectedTab === TabType.ADDON ? 'add-on' : 'menu item'} will be permanently removed from your restaurant. {selectedTab === TabType.CATEGORY ? 'All menu items in this category will remain but will need to be reassigned.' : selectedTab === TabType.ADDON ? 'This add-on will be removed from all associated items.' : 'Customers will no longer be able to order this item.'}</p>
                </div>

            </Modal>

            <Modal
                isOpen={availabilityConfirm !== null}
                onClose={handleCloseModal}
                title="Update Menu Item Availability"
                size="sm"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleAvailabilityUpdateConfirm} isLoading={loading}>
                            Confirm
                        </Button>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">Changing availability will affect customer ordering.</p>
                    <p>Are you sure you want to make this menu item <span className="font-semibold">{availabilityConfirm?.value ? 'available' : 'unavailable'}</span>?</p>
                </div>

            </Modal>

            <Modal
                isOpen={isLinkModalOpen}
                onClose={handleCloseModal}
                title="Link Items to Badge"
                size="md"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleBulkLinkBadges} isLoading={loading}>
                            Save Changes
                        </Button>
                    </div>
                }
            >
                {selectedBadgeForLink && (
                    <BadgeLinkModelSection
                        badge={selectedBadgeForLink}
                        menuItems={menuItemsLessWeight}
                        selectedItemIds={selectedItemIdsForLink}
                        onSelectionChange={setSelectedItemIdsForLink}
                    />
                )}
            </Modal>

            <CategoryReorderModal
                isOpen={isReorderModalOpen}
                onClose={() => setIsReorderModalOpen(false)}
                categories={categoies}
                onSave={handleReorderSave}
                isLoading={categoryLoading}
            />
        </div >
    )
}

export default MenuManage;