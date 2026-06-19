import { FC, useState, useLayoutEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import {
    Box,
    Button,
    useTheme,
    alpha,
} from '@mui/material';
import { createMenuItemRequest, deleteMenuItemRequest, fetchMenuItemLessWeightRequest, fetchMenuItemRequest, menuItemAvailabilityRequest, updateMenuItemRequest, uploadMenuItemImageRequest } from '../../features/menuItems/menuItemSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import MenuItemTab from '../../tabs/Menu/MenuItemTab';
import { Modal } from '../../components/Modal';
import { Button as CustomButton } from '../../components/Button'
import MenuModelSection from '../Model/Menu/MenuModelSection';
import CategoryModelSection from '../Model/Menu/CategoryModelSection';
import { SubmitHandler, useForm } from 'react-hook-form';
import { CreateMenuItemRequest, MenuItem, OptionType } from '../../features/menuItems/types';
import { Category, CategoryRequest } from '../../features/category/types';
import { createCategoryRequest, deleteCategoryRequest, updateCategoryRequest, uploadCategoryImageRequest } from '../../features/category/categorySlice';
import { TabType } from '../../utils/constants';
import CategoryTab from '../../tabs/Menu/CategoryTab';
import { fileToBase64 } from '../../utils';
import allCategories from '../../assets/all_category.png'
import { createAddOnRequest, deleteAddOnRequest, fetchAllAddOnRequest, updateAddOnRequest } from '../../features/addOns/addOnSlice';
import AddOnTab from '../../tabs/Menu/AddOnTab';
import { AddOn, CreateAddOnRequest } from '../../features/addOns/types';
import AddOnModelSection from '../Model/Menu/AddOnModelSection';

interface MenuTabProps {
    restaurantId?: string;
}

export const MenuTab: FC<MenuTabProps> = ({ restaurantId: propRestaurantId }) => {

    const { id } = useParams<{ id: string }>();
    const restaurantId = propRestaurantId || id;
    const theme = useTheme();

    const dispatch = useDispatch<AppDispatch>();
    const { data: menuItems, isCreateMenuItem, image: menuImage, isUpdateMenuItem, isDeleteMenuItem, loading, error: menuError, imageLoading, menuItemsLessWeight } = useSelector((state: RootState) => state.menuItems);
    const { categoies: categories, image: categoriesImage, loading: categoryLoading, isCreateCategory, error: categoryError, isDeleteCategory, isUpdateCategory } = useSelector((state: RootState) => state.categories);
    const { data: addOns, loading: addOnLoading, isCreateAddOn, isUpdateAddOn, isDeleteAddOn, error: addOnError } = useSelector((state: RootState) => state.addOns);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<TabType>(TabType.MENUITEM)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [varientInput, setVarientInput] = useState<OptionType[]>([])
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [availabilityConfirm, setAvailabilityConfirm] = useState<{ value: boolean, menuId: string } | null>(null)
    const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);

    const { register, handleSubmit: menuHandleSubmit, reset: menuReset, watch, control } = useForm<CreateMenuItemRequest>({
        defaultValues: {
            name: "",
            description: "",
            discount: 0,
            image: "",
            price: 0,
            preparationTime: 0,
            quantityAvailable: 0,
            categoryId: "",
            note: "",
            restaurantId: "",
            isAvailable: true
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

    const restructureCategory = categories.map((i) => ({ value: i.id, label: i.name, image: i.image ?? '' }));

    const validateToast = useCallback(() => {
        if (isCreateMenuItem || isDeleteMenuItem || isUpdateMenuItem || isCreateCategory || menuError || categoryError || isDeleteCategory || isCreateAddOn || isUpdateAddOn || isDeleteAddOn || addOnError || isUpdateCategory) {
            setIsModalOpen(false);
            setSelectedItem(null);
            setSelectedCategories([]);
            setIsDeleteModalOpen(false)
            setAvailabilityConfirm(null);
            setSelectedItemId(null);
        }
    }, [isCreateMenuItem, isDeleteMenuItem, isUpdateMenuItem, menuError, isCreateCategory, categoryError, isDeleteCategory, isCreateAddOn, isUpdateAddOn, isDeleteAddOn, addOnError, isUpdateCategory]);

    useLayoutEffect(() => {
        validateToast();
    }, [validateToast])

    useLayoutEffect(() => {
        dispatch(fetchMenuItemRequest({ restaurantId: restaurantId ?? "", search: searchQuery, page: 1, limit: 100 }))
    }, [dispatch, restaurantId, searchQuery])

    useLayoutEffect(() => {
        dispatch(fetchAllAddOnRequest(restaurantId!))
    }, [dispatch, restaurantId])

    useLayoutEffect(() => {
        if (selectedTab === TabType.MENUITEM) {
            dispatch(fetchMenuItemLessWeightRequest({ restaurantId: restaurantId! }))
        }
    }, [dispatch, selectedTab])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
    };

    const handleCategoryToggle = (categoryName: string) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryName)) {
                return prev.filter(cat => cat !== categoryName);
            } else {
                return [...prev, categoryName];
            }
        });
    };

    const handleAdd = () => {
        setIsModalOpen(true);
        menuReset({
            name: "",
            description: "",
            image: "",
            categoryId: "",
            note: "",
            restaurantId: "",
            isAvailable: true
        });
        categoryReset();
        setSelectedCategories([]);
    }

    const handleCreateCategory: SubmitHandler<CategoryRequest> = (data) => {
        if (selectedCategory) {
            dispatch(updateCategoryRequest({ ...data, id: selectedCategory.id, restaurantId: restaurantId!, image: categoriesImage?.url ?? selectedCategory.image ?? "" }))
        } else {
            dispatch(createCategoryRequest({ ...data, restaurantId: restaurantId!, image: categoriesImage?.url ?? "" }))
        }
        categoryReset();
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

    const handleCreateAddOn: SubmitHandler<CreateAddOnRequest> = (data) => {
        if (selectedAddOn) {
            dispatch(updateAddOnRequest({ ...data, id: selectedAddOn.id, restaurantId: restaurantId!, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice) }));
        } else {
            dispatch(createAddOnRequest({ ...data, restaurantId: restaurantId!, quantity: Number(data.quantity), unitPrice: Number(data.unitPrice) }));
        }
        addOnReset();
    }

    const handleCreateMenuItem: SubmitHandler<CreateMenuItemRequest> = useCallback((data) => {
        const body: CreateMenuItemRequest = {
            ...data,
            price: Number(data.price),
            discount: data.discount ? Number(data.discount) : undefined,
            preparationTime: data.preparationTime ? Number(data.preparationTime) : undefined,
            quantityAvailable: data.quantityAvailable ? Number(data.quantityAvailable) : undefined,
            restaurantId: restaurantId ?? "",
            image: menuImage?.url,
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
        } else {
            dispatch(createMenuItemRequest(body));
        }
    }, [dispatch, selectedItem, varientInput, menuImage])

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
        setIsDeleteModalOpen(false)
        setSelectedItemId(null);
        setAvailabilityConfirm(null);
    }

    const handleVariantOption = (values: OptionType[]) => {
        setVarientInput(values)
    }

    const handleSelectTab = (tab: TabType) => {
        setSelectedTab(tab);
        setSelectedCategories([]);
    }

    const handleMenuItemEdit = (item: MenuItem) => {
        setIsModalOpen(true);
        setSelectedItem(item);
    }

    const handleCategoryEdit = (category: Category) => {
        setIsModalOpen(true);
        setSelectedCategory(category);
        categoryReset({
            name: category.name,
            description: category.description || "",
            image: category.image || "",
            restaurantId: restaurantId ?? ""
        });
    }

    const handleeDeleteConfirm = useCallback((itemId: string) => {
        setSelectedItemId(itemId)
        handleDeleteModel();
    }, [])

    const handleAvailability = (value: boolean, menuId: string) => {
        setAvailabilityConfirm({ value, menuId })
    }

    const handleDeleteModel = () => {
        setIsDeleteModalOpen(true)
    }

    const handleAvailabilityUpdateConfirm = () => {
        if (availabilityConfirm) {
            dispatch(menuItemAvailabilityRequest({ menuId: availabilityConfirm.menuId, restaurantId: restaurantId ?? "", value: availabilityConfirm.value }))
        }
    }

    const handleDelete = () => {
        if (selectedTab === TabType.MENUITEM) {
            dispatch(deleteMenuItemRequest({ menuId: selectedItemId ?? "", restaurantId: restaurantId ?? "" }))
        } else if (selectedTab === TabType.CATEGORY) {
            dispatch(deleteCategoryRequest({ ids: selectedCategories, restaurantId: restaurantId ?? "" }))
            setSelectedCategories([]);
        } else {
            dispatch(deleteAddOnRequest(selectedItemId ?? ""));
        }
    }

    const handleImageUpload = async (file: File | null) => {
        if (file && restaurantId) {
            const base64 = await fileToBase64(file);
            dispatch(uploadMenuItemImageRequest({ restaurantId: restaurantId, image: base64 }));
        }
    };

    const handleCategoryImageUpload = async (file: File | null) => {
        if (file && restaurantId) {
            const base64 = await fileToBase64(file);
            dispatch(uploadCategoryImageRequest({ restaurantId: restaurantId, image: base64 }));
        }
    };

    const handleAddOnEdit = (addOn: AddOn) => {
        setIsModalOpen(true);
        setSelectedAddOn(addOn);
        addOnReset({
            name: addOn.name,
            description: addOn.description || "",
            unitPrice: addOn.unitPrice,
            quantity: addOn.quantity,
            restaurantId: restaurantId || "",
            menuIds: addOn.menus.map((menu) => menu.id)
        });
    }

    const handleAddOnDeleteConfirm = (id: string) => {
        setSelectedItemId(id);
        handleDeleteModel();
    }

    const disableSubmit = (!watch('name') || !watch('description') || !watch('categoryId') || !watch('price') || !watch('preparationTime') || !watch('quantityAvailable')) && selectedTab === TabType.MENUITEM

    const disableCategorySubmit = (!categoryWatch('name') || !categoryWatch('description')) && selectedTab === TabType.CATEGORY

    const disableAddOnSubmit = (!addOnWatch('name') || !addOnWatch('description') || !addOnWatch('unitPrice')) && selectedTab === TabType.ADDON

    return (
        <Box sx={{ pb: 4 }}>
            {/* Header Section */}
            <Box sx={{
                display: 'flex lg:flex-row',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 2,
                mb: 3
            }}>
                <div className="bg-white rounded-2xl shadow-md p-2">
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            <div
                                onClick={() => handleSelectTab(TabType.MENUITEM)}
                                className={`
                                px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer
                                transition-all duration-300 ease-in-out
                                ${selectedTab === TabType.MENUITEM
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }
                            `}
                            >
                                <span className="flex items-center space-x-2">
                                    <span>Menu Items</span>
                                    <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    ${selectedTab === TabType.MENUITEM ? 'bg-white/20' : 'bg-gray-200'}
                                `}>
                                        {menuItems.length}
                                    </span>
                                </span>
                            </div>
                            <div
                                onClick={() => handleSelectTab(TabType.CATEGORY)}
                                className={`
                                px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer
                                transition-all duration-300 ease-in-out
                                ${selectedTab === TabType.CATEGORY
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }
                            `}
                            >
                                <span className="flex items-center space-x-2">
                                    <span>Categories</span>
                                    <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    ${selectedTab === TabType.CATEGORY ? 'bg-white/20' : 'bg-gray-200'}
                                `}>
                                        {categories.length}
                                    </span>
                                </span>
                            </div>
                            <div
                                onClick={() => handleSelectTab(TabType.ADDON)}
                                className={`
                                px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center
                                transition-all duration-300 ease-in-out
                                ${selectedTab === TabType.ADDON
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }
                            `}
                            >
                                <span className="flex items-center justify-center space-x-2">
                                    <span>Add-ons</span>
                                    <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    ${selectedTab === TabType.ADDON ? 'bg-white/20' : 'bg-gray-200'}
                                `}>
                                        {addOns.length}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CustomButton
                                onClick={handleAdd}
                                className="text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {selectedTab === TabType.CATEGORY ? 'Add Category' : selectedTab === TabType.ADDON ? 'Add Add-on' : 'Add Item'}
                            </CustomButton>
                        </div>
                    </div>
                </div>
            </Box>

            {selectedCategories.length > 0 && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        zIndex: 1000,
                    }}
                >
                    <Button
                        variant="contained"
                        startIcon={<Trash2 size={20} />}
                        onClick={handleDeleteModel}
                        sx={{
                            textTransform: 'none',
                            borderRadius: 4,
                            px: 3,
                            py: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                            boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.4)}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px) scale(1.05)',
                                boxShadow: `0 12px 32px ${alpha(theme.palette.error.main, 0.5)}`,
                            },
                        }}
                    >
                        Delete {selectedCategories.length} {selectedCategories.length === 1 ? 'Category' : 'Categories'}
                    </Button>
                </Box>
            )}

            {selectedTab === TabType.MENUITEM ? (
                <MenuItemTab
                    theme={theme}
                    categories={[{ id: "", name: "All Items", image: allCategories }, ...categories]}
                    handleSearchChange={handleSearchChange}
                    searchQuery={searchQuery}
                    reset={menuReset}
                    onEdit={handleMenuItemEdit}
                    onDelete={handleeDeleteConfirm}
                    onAvailability={handleAvailability}
                />
            ) : selectedTab === TabType.CATEGORY ? (
                <CategoryTab
                    dataList={categories}
                    itemList={menuItems}
                    checkList={selectedCategories}
                    onClick={handleCategoryToggle}
                    onEdit={handleCategoryEdit}
                    loading={categoryLoading}
                />
            ) : (
                <AddOnTab
                    dataList={addOns}
                    loading={addOnLoading}
                    onEdit={handleAddOnEdit}
                    onDelete={handleAddOnDeleteConfirm}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={selectedItem ? selectedTab === TabType.MENUITEM ? 'Edit Menu Item' : selectedTab === TabType.ADDON ? 'Edit Add On' : 'Edit Category' : selectedTab === TabType.MENUITEM ? 'Add Menu Item' : selectedTab === TabType.ADDON ? 'Add Add On' : 'Add Category'}
                size={selectedTab === TabType.MENUITEM ? "lg" : "sm"}
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <CustomButton variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </CustomButton>
                        <CustomButton isLoading={loading || categoryLoading || imageLoading || addOnLoading} onClick={handleSubmit} disabled={selectedTab === TabType.MENUITEM ? disableSubmit : selectedTab === TabType.ADDON ? disableAddOnSubmit : disableCategorySubmit}>
                            {selectedItem ? 'Save Changes' : selectedTab === TabType.MENUITEM ? 'Create Item' : selectedTab === TabType.ADDON ? 'Create Add On' : 'Create Category'}
                        </CustomButton>
                    </div>
                }
            >
                {selectedTab === TabType.MENUITEM ? (
                    <MenuModelSection
                        categoryList={restructureCategory}
                        register={register}
                        watch={watch}
                        control={control}
                        onChange={handleVariantOption}
                        onImageUpload={handleImageUpload}
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
                        <CustomButton variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </CustomButton>
                        <CustomButton variant="danger" onClick={handleDelete} isLoading={loading}>
                            Confirm
                        </CustomButton>
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
                        <CustomButton variant="ghost" onClick={handleCloseModal}>
                            Cancel
                        </CustomButton>
                        <CustomButton variant="primary" onClick={handleAvailabilityUpdateConfirm} isLoading={loading}>
                            Confirm
                        </CustomButton>
                    </div>
                }
            >
                <div className="text-gray-700">
                    <p className="font-medium mb-2">Changing availability will affect customer ordering.</p>
                    <p>Are you sure you want to make this menu item <span className="font-semibold">{availabilityConfirm?.value ? 'available' : 'unavailable'}</span>?</p>
                </div>

            </Modal>
        </Box>
    );
};