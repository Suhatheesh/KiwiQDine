import { Control, Controller, UseFormRegister, UseFormWatch } from "react-hook-form";
import { CreateMenuItemRequest, OptionType } from "../../../features/menuItems/types";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { TextArea } from "../../../components/TextArea";
import { FC, useLayoutEffect, useState } from "react";
import ImageUploadInput from "../../../components/ImageUploadInput";
import { IOSSwitch } from "../../../components/Switch";
import { Button } from "../../../components/Button";
import { Plus, Tag } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { MultiSelect } from "../../../components/MultiSelect";
import { hexToRgba } from "../../../utils";

interface MenuModelSection {
    type: 'create' | 'edit';
    categoryList: {
        value: string;
        label: string;
    }[];
    register: UseFormRegister<CreateMenuItemRequest>;
    watch: UseFormWatch<CreateMenuItemRequest>
    control: Control<CreateMenuItemRequest>
    onChange?: (values: OptionType[]) => void
    onImageUpload: (file: File | null) => void;
    badgeList?: {
        value: string;
        label: string;
        backgroundColor?: string;
        textColor?: string;
    }[];
}

const MenuModelSection: FC<MenuModelSection> = ({ type, categoryList, badgeList = [], register, watch, control, onChange, onImageUpload }) => {
    const { primaryColor } = useAuth()
    const variantOptions = watch('variantOptions')
    const variantOptionsOptions = variantOptions?.[0].options;
    const editedVariantOptions = variantOptionsOptions?.map((variant) => variant.price === Number(watch('price')) ? { ...variant, isDefault: true } : variant);


    const [varientInput, setVarientInput] = useState<OptionType[]>(editedVariantOptions || [])

    useLayoutEffect(() => {
        if (onChange) onChange(varientInput)
    }, [onChange, varientInput])

    const generateFeatureInput = () => {
        setVarientInput((prev) => {
            const newId = prev.length <= 0 ? 1 : prev[prev.length - 1].id! + 1;
            return [...prev, { id: newId, name: '', price: prev.length <= 0 ? Number(watch('price')) : 0, isDefault: prev.length <= 0 }]
        });
    }

    const addVarientName = (id: number, name: string, type: 'name' | 'price') => {
        setVarientInput((prev) => {
            if (type === 'name') {
                return prev.map((item, index) =>
                    index === id ? { ...item, name } : item
                )
            } else {
                return prev.map((item, index) =>
                    index === id ? { ...item, price: Number(name) } : item
                )
            }
        });
    };

    const addVarientDefault = (id: number, status: boolean) => {
        setVarientInput((prev) => {
            return prev.map((item, index) =>
                index === id ? { ...item, isDefault: status } : { ...item, isDefault: false }
            )
        });
    };

    const removeFeature = (index: number) => {
        setVarientInput((prev) => {
            const isRemovingDefault = prev[index].isDefault;
            const filtered = prev.filter((_, i) => i !== index);

            if (isRemovingDefault && filtered.length > 0) {
                return filtered.map((item, i) =>
                    i === 0 ? { ...item, isDefault: true } : item
                );
            }

            return filtered;
        });
    }

    const preventMinus = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full-width section */}
                <div className="col-span-2 space-y-4">
                    <Input
                        id="name"
                        label="Item Name*"
                        placeholder="Enter Item Name"
                        {...register("name")}
                    />

                    <TextArea
                        id="description"
                        label="Description*"
                        value={watch('description') || ''}
                        placeholder="Brief description of the item"
                        {...register("description")}
                    />
                </div>

                <Select
                    id="category"
                    label="Category*"
                    options={[{ value: "", label: "Select Category" }, ...categoryList]}
                    {...register("categoryId")}
                />

                <Input
                    id="price"
                    label="Price*"
                    type="number"
                    onKeyDown={preventMinus}
                    placeholder="NZD 10.00"
                    min={0}
                    {...register("price")}
                />

                <Input
                    id="discount"
                    label="Discount (%)"
                    type="number"
                    placeholder="0.00"
                    min={0}
                    max={100}
                    suffix="%"
                    onKeyDown={preventMinus}
                    {...register("discount")}
                />

                <Controller
                    control={control}
                    name="preparationTime"
                    render={({ field: { onChange, value } }) => {
                        const minutes = value === undefined ? '' : value % 60;
                        return (
                            <div className="flex space-x-4">
                                <Input
                                    id="prep-minutes"
                                    label="Minutes*"
                                    type="number"
                                    placeholder="0"
                                    min={0}
                                    max={59}
                                    value={minutes}
                                    onKeyDown={preventMinus}
                                    onChange={(e) => {
                                        const newMinutes = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        onChange(newMinutes);
                                    }}
                                />
                            </div>
                        );
                    }}
                />

                <Input
                    id="quantityAvailable"
                    label="QTY*"
                    type="number"
                    placeholder="0"
                    min={0}
                    onKeyDown={preventMinus}
                    {...register("quantityAvailable")}
                />

                {type === 'create' ? (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-transparent">.</label>
                        <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 h-[42px] bg-white">
                            <p className="font-medium text-sm">Available Status</p>
                            <IOSSwitch primaryColor={primaryColor} checked={watch('isAvailable')} {...register('isAvailable')} />
                        </div>
                    </div>
                ) : <div />}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Feature Status</label>
                    <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4 h-[42px] bg-white">
                        <p className="font-medium text-sm">Featured Item</p>
                        <IOSSwitch
                            primaryColor={primaryColor}
                            checked={watch('isFeatured')}
                            {...register('isFeatured')}
                        />
                    </div>
                </div>

                {watch('isFeatured') ? (
                    <Input
                        id="featuredOrder"
                        label="Display Order"
                        type="number"
                        placeholder="e.g. 1"
                        {...register("featuredOrder")}
                    />
                ) : <div />}

                {/* Badge Selection */}
                <div className="col-span-2 space-y-3">
                    <Controller
                        control={control}
                        name="badges"
                        render={({ field: { onChange, value } }) => (
                            <MultiSelect
                                label="Assigned Badges"
                                placeholder="Search and select badges (e.g., Spicy, New, Popular)..."
                                options={badgeList}
                                value={(value as string[]) || []}
                                onChange={onChange}
                            />
                        )}
                    />

                    {/* Visual Badges Preview */}
                    <div className="flex flex-wrap gap-2 min-h-[32px] p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        {((watch('badges') as string[]) || []).length > 0 ? (
                            ((watch('badges') as string[]) || []).map(code => {
                                const badge = badgeList.find(b => b.value === code);
                                if (!badge) return null;
                                return (
                                    <div
                                        key={code}
                                        style={{
                                            backgroundColor: badge.backgroundColor,
                                            color: badge.textColor,
                                            border: `1px solid ${hexToRgba(badge.textColor || '#000', 0.2)}`
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transform hover:scale-105 transition-transform"
                                    >
                                        <Tag className="w-3 h-3" />
                                        {badge.label}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-xs text-gray-400 italic">No badges assigned to this item yet.</p>
                        )}
                    </div>
                </div>

                {/* Image + Variants */}
                <div className="col-span-2 space-y-4">
                    <ImageUploadInput
                        value={watch('image')}
                        placeholder="Upload Image"
                        onChange={onImageUpload}
                    />

                    <div className="flex items-center justify-between">
                        <p>Variants (Optional)</p>
                        <Button variant="outline" onClick={generateFeatureInput} type="button">
                            <Plus className="w-5 h-5 mr-2" />
                            <p>Add variant</p>
                        </Button>
                    </div>

                    {varientInput.map((item, index) => (
                        <div key={index}>
                            <div className="flex space-x-4 items-center flex-1">
                                <Input
                                    id={`variant-${index}`}
                                    label={`Variant #${index + 1}`}
                                    placeholder="Variant name (e.g., Size)"
                                    value={item.name}
                                    onChange={(e) => addVarientName(index, e.target.value, "name")}
                                />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    min={0}
                                    id={`variant-price-${index}`}
                                    value={item.isDefault ? watch('price') : item.price === 0 ? '' : item.price}
                                    onChange={(e) => addVarientName(index, e.target.value, "price")}
                                    disabled={item.isDefault}
                                    showButton
                                    onKeyDown={preventMinus}
                                    className="text-right pr-10 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [appearance:textfield]"
                                    isAddButton={false}
                                    onRemove={() => removeFeature(index)}
                                />
                                <input
                                    id={`variant-default-${index}`}
                                    type="radio"
                                    name="variantDefault"
                                    checked={item.isDefault}
                                    className="w-10 h-10 mt-5"
                                    onChange={(e) => addVarientDefault(index, e.target.checked)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </form>

    )
}

export default MenuModelSection;



// const generateOptionsInput = (id: number) => {
//     setVarientInput((prev) => {
//         return prev.map((i) => i.id === id ? { ...i, options: [...i.options!, { name: '' }] } : i)
//     });
// }

// const removeOptionsInput = (id: number, optionIndex: number) => {
//     setVarientInput((prev) => {
//         return prev.map((i) => i.id === id ? { ...i, options: i.options?.filter((_, i) => i !== optionIndex) } : i)
//     });
// }


// const addVarientOptionValues = (id: number, value: string, optionIndex: number, type: 'name' | 'price') => {
//     setVarientInput((prev) =>
//         type === 'name' ?
//             prev.map((item) =>
//                 item.id === id ? { ...item, options: item.options?.map((option, i) => i === optionIndex ? { ...option, name: value } : option) } : item
//             ) :
//             prev.map((item) =>
//                 item.id === id ? { ...item, options: item.options?.map((option, i) => i === optionIndex ? { ...option, priceModifier: Number(value) } : option) } : item
//             )
//     );
// };