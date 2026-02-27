import React, { useEffect, useState } from "react";
import { categoryApi } from "../../api/categories";
import type {CategoryTypeDto, CategoryValueDto} from "../../types";

import style from './SidebarCategory.module.css';

interface SidebarCategoryProps {
    onSelectType: (typeName: string | null) => void;
    onSelectValue: (valueName: string | null) => void;
    selectedType: string | null;
    selectedValue: string | null;
}

export const SidebarCategory: React.FC<SidebarCategoryProps> = ({
                                                                    onSelectType, onSelectValue, selectedType, selectedValue
}) => {
    const [types, setTypes] = useState<CategoryTypeDto[]>([]);
    const [allValues, setAllValues] = useState<CategoryValueDto[]>([]);

    useEffect(() => {
        categoryApi.getTypes().then(setTypes).catch(console.error);
        categoryApi.getAllValues().then(setAllValues).catch(console.error);
    }, []);

    const handleTypeClick = (e: React.MouseEvent, typeName: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Клик по типу:", typeName);
        onSelectType(typeName);
        onSelectValue(null);        // Сбрасываем значение при смене типа
    };

    return (
        <aside className={style.sidebar}>
            <h3 className={style.menuTitle}>Категории</h3>
            <ul className={style.menuList}>
                <li
                    className={selectedType === null ? style.active : ''}
                    onClick={(e) => handleTypeClick(e,null)}
                    >
                    {/*🏠Все рецепты*/}
                    <label style={{backgroundColor: '#E2E2E8', borderColor: '#97979C', fontSize: '25px'}}>🍽️</label> <label style={{marginLeft: '5px'}}>Все рецепты</label>
                </li>

                {types.map((type) => (
                    <React.Fragment key={type.id}>
                        <li
                        key={type.id}
                        className={selectedType === type.nameType ? style.active : ''}
                        onClick={(e) => handleTypeClick(e, type.nameType)}
                        >
                            📁  {type.nameType}
                        </li>

                        {/* ПОДМЕНЮ: показываем значения, если тип выбран */}
                        {selectedType?.trim() === type.nameType.trim() && (
                            <ul className={style.subMenu}>
                                {allValues
                                    .filter(v => Number(v.typeId) === Number(type.id))
                                    .map(val => (
                                        <li
                                        key={val.id}
                                        className={selectedValue === val.categoryValue ? style.subActive : ''}
                                        onClick={() => onSelectValue(val.categoryValue)}
                                        >
                                            └  {val.categoryValue}
                                        </li>
                                    ))
                                }
                            </ul>
                        )}

                    </React.Fragment>
                ))}
            </ul>
        </aside>
    )
}