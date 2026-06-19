import { FC } from "react"
import { Category } from "../../features/category/types"
import { MenuItem } from "../../features/menuItems/types"
import { CategoryCardSkeleton } from "../../components/CustomSkeleton";
import EmptyState from "../../components/EmptyState";
import { FolderOpen, Pencil } from "lucide-react";
import placeholder from '../../assets/placeholder.png'
import { useAuth } from "../../hooks/useAuth";

interface CategorySectionProps {
    dataList: Category[];
    itemList: MenuItem[];
    checkList?: string[];
    allowedRoles: string[]
    onClick?: (id: string) => void;
    onEdit?: (category: Category) => void;
    loading?: boolean;
}

const CategorySection: FC<CategorySectionProps> = ({ dataList, checkList = [], onClick, onEdit, loading, allowedRoles }) => {
    const { user } = useAuth()
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 grid-flow-row gap-3 space-y-3">
            {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                    <CategoryCardSkeleton key={index} />
                ))
            ) : dataList.length === 0 ? (
                <div className="col-span-full">
                    <EmptyState
                        icon={FolderOpen}
                        title="No categories found"
                        description="Create a new category to organize your menu items."
                    />
                </div>
            ) : (
                dataList.map((category) => {
                    return (
                        <div onClick={() => onClick && onClick(category.id)} key={category.id} className="flex h-24 bg-gray-100 rounded-lg px-2 items-center justify-between space-x-4 cursor-pointer hover:bg-gray-200">
                            <div className="flex items-center gap-3">
                                <img src={category.image || placeholder} className="h-20 w-20 object-cover rounded-lg" />
                                <div className="flex flex-col ">
                                    <p className="font-bold">{category.name}  {`(${category.itemCount})`}</p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{category.description}</p>
                                </div>
                            </div>
                            {allowedRoles.includes(user!.role!) && (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit && onEdit(category);
                                        }}
                                        className="p-2 hover:bg-gray-300 rounded-full transition-colors"
                                    >
                                        <Pencil className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <input
                                        type="checkbox"
                                        className="cursor-pointer"
                                        value={category.id}
                                        checked={checkList?.some((i) => i === category.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            onClick && onClick(category.id);
                                        }}
                                    />
                                </div>
                            )}

                        </div>
                    )
                })
            )}
        </div>
    )
}

export default CategorySection