import { FC } from "react";
import { CategoryRequest } from "../../../features/category/types";
import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { Input } from "../../../components/Input";
import { TextArea } from "../../../components/TextArea";
import ImageUploadInput from "../../../components/ImageUploadInput";

interface MenuModelSection {
    register: UseFormRegister<CategoryRequest>;
    watch: UseFormWatch<CategoryRequest>
    onImageUpload: (file: File | null) => void
}

const CategoryModelSection: FC<MenuModelSection> = ({ register, watch, onImageUpload }) => {
    return (
        <form>
            <div className="space-y-2">
                <Input
                    id="name"
                    label="Name*"
                    placeholder="John Doe"
                    {...register('name')}
                />
                <TextArea
                    id="price"
                    label="Description"
                    value={watch('description')}
                    {...register('description')}
                />
                <ImageUploadInput
                    placeholder="Upload Image"
                    onChange={onImageUpload}
                />
            </div>
        </form>
    )
}

export default CategoryModelSection;