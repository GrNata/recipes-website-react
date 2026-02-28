import React from "react";
import style from './Pagination.module.css';

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
            <button
                onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className={style.pageBtn}
            >
                &laquo; Назад
            </button>

            <span className={style.pageInfo}>
                Страница {currentPage + 1} из { totalPages }
            </span>

            <button
                onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className={style.pageBtn}
            >
                Вперед &raqou;
            </button>
        </div>
    )
};