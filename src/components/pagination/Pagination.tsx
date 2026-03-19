import React from "react";
import style from './Pagination.module.css';
import {ChevronFirst, ChevronLast, ChevronLeft, ChevronRight} from "lucide-react";

interface PaginationProps {
    currentPage: number;        // Текущая страница (начиная с 0, как отдаёт Spring)
    totalPages: number;          // Всего страниц
    onPageChange: (newPage: number) => void;        // Функция для смены страницы
}

export const Pagination: React.FC<PaginationProps> = ({
                                                          currentPage,
                                                          totalPages,
                                                          onPageChange
                                                      }) => {
    // Если страница всего одна (или их вообще нет), прячем блок пагинации
    if (totalPages <= 1) return null;

    return (
        <div className={style.pagination}>
            {/* Кнопка "В самое начало" */}
            <button
                onClick={() => onPageChange(0)}
                disabled={currentPage === 0}
                className={style.pageBtn}
                title='На первую страницу'
            >
                <ChevronFirst size={20} />
            </button>

            {/* Кнопка "На одну назад" */}
            <button
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={style.pageBtn}
                title='Назад'
            >
                <ChevronLeft size={20} />
            </button>

            {/* Компактная информация о странице */}
            <span className={style.pageInfo}>
                Страница {currentPage + 1} из { totalPages }
            </span>

            {/* Кнопка "На одну вперед" */}
            <button
                onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className={style.pageBtn}
            >
                <ChevronRight size={20}/>
            </button>

            {/* Кнопка "В самый конец" */}
            <button
                onClick={() => onPageChange(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
                className={style.pageBtn}
                title='На последнюю страницу'
            >
                <ChevronLast />
            </button>
        </div>
    )
};