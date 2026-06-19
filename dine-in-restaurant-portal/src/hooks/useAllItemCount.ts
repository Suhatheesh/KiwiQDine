import { useSelector } from "react-redux"
import { RootState } from "../app/store"
import { useEffect, useState } from "react";

const useAllItemCount = () => {
    const [count, setCount] = useState<number>(0);
    const categories = useSelector((state: RootState) => state.category).categoies;

    useEffect(() => {
        const itemCount = categories.reduce((prev, next) => prev + (next.itemCount ?? 0), 0);
        setCount(itemCount);
    }, [categories])

    return { count };
}

export default useAllItemCount;