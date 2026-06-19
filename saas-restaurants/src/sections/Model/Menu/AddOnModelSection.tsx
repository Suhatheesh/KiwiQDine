import { FC } from "react";
import { CreateAddOnRequest } from "../../../features/addOns/types";
import { UseFormRegister, UseFormWatch, Control, Controller } from "react-hook-form";
import { Input } from "../../../components/Input";
import { TextArea } from "../../../components/TextArea";
import { MultiSelect } from "../../../components/MultiSelect"; // Import MultiSelect

interface AddOnModelSectionProps {
    type: 'create' | 'edit';
    categoryList: {
        value: string;
        label: string;
    }[];
    register: UseFormRegister<CreateAddOnRequest>;
    watch: UseFormWatch<CreateAddOnRequest>;
    control: Control<CreateAddOnRequest>; // Control is now required for Controller
}

const AddOnModelSection: FC<AddOnModelSectionProps> = ({ categoryList, register, control, watch }) => {
    return (
        <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Input
                        id="name"
                        label="Add-on Name*"
                        placeholder="e.g. Extra Cheese"
                        {...register("name", { required: true })}
                    />
                </div>

                <div className="col-span-2">
                    <TextArea
                        id="description"
                        label="Description*"
                        value={watch('description')}
                        placeholder="Brief description of the add-on"
                        {...register("description", { required: true })}
                    />
                </div>

                <Input
                    id="unitPrice"
                    label="Unit Price (NZD)*"
                    type="number"
                    placeholder="0.00"
                    {...register("unitPrice", { required: true, min: 0 })}
                />

                <Input
                    id="quantity"
                    label="Quantity (Stock)*"
                    type="number"
                    placeholder="0"
                    {...register("quantity", { required: true, min: 0 })}
                />

                <div className="col-span-2">
                    <Controller
                        control={control}
                        name="menuIds"
                        rules={{ required: true }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <MultiSelect
                                label="Menu Items*"
                                placeholder="Select menu items..."
                                options={categoryList} // This prop name should probably be menuList now, but keeping for now based on props
                                value={value || []}
                                onChange={onChange}
                                error={error?.message}
                            />
                        )}
                    />
                </div>
            </div>
        </form>
    );
};

export default AddOnModelSection;
