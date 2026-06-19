import { Control, Controller, UseFormRegister, UseFormWatch } from "react-hook-form";
import { CreateMenuItemRequest, MenuItem, OptionType } from "../../../features/menuItems/types";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { TextArea } from "../../../components/TextArea";
import { FC, useLayoutEffect, useState } from "react";
import ImageUploadInput from "../../../components/ImageUploadInput";
import { IOSSwitch } from "../../../components/Switch";
import { Button } from "../../../components/Button";
import { Plus } from "lucide-react";

interface MenuModelSection {
    item?: MenuItem;
    categoryList: {
        value: string;
        label: string;
    }[];
    register: UseFormRegister<CreateMenuItemRequest>;
    watch: UseFormWatch<CreateMenuItemRequest>
    control: Control<CreateMenuItemRequest>
    onChange?: (values: OptionType[]) => void
    onImageUpload: (file: File | null) => void
}

const MenuModelSection: FC<MenuModelSection> = ({ categoryList, register, watch, control, onChange, onImageUpload }) => {
    const variantOptions = watch('variantOptions')
    const variantOptionsOptions = variantOptions?.[0].options
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
                    onKeyDown={preventMinus}
                    type="number"
                    placeholder="NZD 10.00"
                    {...register("price")}
                />

                <Input
                    id="discount"
                    label="Discount"
                    onKeyDown={preventMinus}
                    type="number"
                    placeholder="0.00"
                    {...register("discount")}
                />

                <Controller
                    control={control}
                    name="preparationTime"
                    render={({ field: { onChange, value } }) => {
                        const hours = value === undefined ? '' : Math.floor(value / 60);
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
                                    onKeyDown={preventMinus}
                                    value={minutes}
                                    onChange={(e) => {
                                        const newMinutes = e.target.value === '' ? 0 : parseInt(e.target.value);
                                        const currentHours = hours === '' ? 0 : hours;
                                        onChange((currentHours * 60) + newMinutes);
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
                    min='0'
                    placeholder="0"
                    onKeyDown={preventMinus}
                    {...register("quantityAvailable")}
                />

                <div className="flex justify-between items-center border border-gray-300 rounded-lg px-4">
                    <p className="font-medium">Available</p>
                    <IOSSwitch checked={watch('isAvailable')} {...register('isAvailable')} />
                </div>

                {/* Image + Variants */}
                <div className="col-span-2 space-y-4">
                    <ImageUploadInput
                        value={watch('image') || ''}
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
                                    label={`Variant #${item.id}`}
                                    placeholder="Variant name (e.g., Size)"
                                    value={item.name}
                                    onChange={(e) => addVarientName(index, e.target.value, "name")}
                                />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    id={`variant-price-${index}`}
                                    value={item.isDefault ? watch('price') : item.price === 0 ? '' : item.price}
                                    onChange={(e) => addVarientName(index, e.target.value, "price")}
                                    disabled={item.isDefault}
                                    onKeyDown={preventMinus}
                                    showButton
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
