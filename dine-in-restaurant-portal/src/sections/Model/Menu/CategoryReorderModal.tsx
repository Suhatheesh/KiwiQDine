import { FC, useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Save, GripVertical } from "lucide-react";
import { Category } from "../../../features/category/types";
import { Button } from "../../../components/Button";
import { Modal } from "../../../components/Modal";
import placeholder from "../../../assets/placeholder.png";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    category: Category;
    index: number;
    total: number;
    isLoading?: boolean;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

const SortableItem: FC<SortableItemProps> = ({ category, index, total, isLoading, onMove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 bg-gray-50 p-3 rounded-xl border transition-all group ${isDragging ? 'border-blue-500 shadow-xl bg-blue-50' : 'border-gray-100 hover:border-blue-200'
                }`}
        >
            <div
                {...attributes}
                {...listeners}
                className="text-gray-400 group-hover:text-blue-400 cursor-grab active:cursor-grabbing p-1"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            <img
                src={category.image || placeholder}
                className="w-10 h-10 rounded-lg object-cover bg-white shadow-sm"
                alt={category.name}
            />

            <div className="flex-1">
                <p className="font-semibold text-gray-900">{category.name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{category.description}</p>
            </div>

            <div className="flex gap-1" onPointerDown={e => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={() => onMove(index, 'up')}
                    disabled={index === 0 || isLoading}
                    className={`p-2 rounded-lg transition-colors ${index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm'
                        }`}
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onMove(index, 'down')}
                    disabled={index === total - 1 || isLoading}
                    className={`p-2 rounded-lg transition-colors ${index === total - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-white hover:text-blue-600 shadow-sm'
                        }`}
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

interface CategoryReorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSave: (reorderedCategories: Category[]) => void;
    isLoading?: boolean;
}

const CategoryReorderModal: FC<CategoryReorderModalProps> = ({
    isOpen,
    onClose,
    categories,
    onSave,
    isLoading
}) => {
    const [localCategories, setLocalCategories] = useState<Category[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen) {
            setLocalCategories([...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
        }
    }, [isOpen, categories]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLocalCategories((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);
                return newItems.map((cat, i) => ({
                    ...cat,
                    displayOrder: i + 1
                }));
            });
        }
    };

    const moveCategory = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= localCategories.length) return;

        setLocalCategories((items) => {
            const newItems = [...items];
            [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
            return newItems.map((cat, i) => ({
                ...cat,
                displayOrder: i + 1
            }));
        });
    };

    const handleSave = () => {
        onSave(localCategories);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reorder Categories"
            size="md"
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        isLoading={isLoading}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Order
                    </Button>
                </div>
            }
        >
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-sm text-gray-500 mb-4">
                    Drag and drop categories or use the arrows to change the order.
                </p>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={localCategories.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-col gap-2">
                            {localCategories.map((category, index) => (
                                <SortableItem
                                    key={category.id}
                                    category={category}
                                    index={index}
                                    total={localCategories.length}
                                    isLoading={isLoading}
                                    onMove={moveCategory}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </Modal>
    );
};

export default CategoryReorderModal;
