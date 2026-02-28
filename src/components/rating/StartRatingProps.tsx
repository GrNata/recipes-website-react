import React, { useState} from "react";
import { Star } from 'lucide-react';
import style from './StarRating.module.css';

interface StarRatingProps {
    initialRating?: number;     //  Средний рейтинг из БД (например, 4.2)
    onRate?: (score: number) => void;       //  Колбэк для отправки оценки на бэк
    readonly?: boolean;     //  Если true, нельзя кликать (для карточек в списке)
    size?: number;      //  Размер звезд в пикселях
}

export const StarRating: React.FC<StarRatingProps> = ({
    initialRating = 0,
    onRate,
    readonly = false,
    size = 20
}) => {
//     // Состояние для "ховера" (когда пользователь наводит мышкой на звезду)
    const [hoverRating, setHoverRating] = useState(0);

    // Определяем, какую оценку показывать в данный момент
    // Если мы навели мышкой — показываем hoverRating, если нет — исходный рейтинг
    const displayRating = hoverRating || initialRating;

    const handleMouseLeave = () => {
        if (!readonly) setHoverRating(0);
    };

    const handleClick = (score: number) => {
        if (!readonly && onRate) {
            onRate(score);
        }
    };

    return (
        <div
            className={style.starContainer}
            onMouseLeave={handleMouseLeave}
        >
            {[1, 2, 3, 4, 5].map((starValue) => {
                // Звезда закрашена, если её номер <= текущей оценке
                const isFilled = starValue <= Math.round(displayRating);

                return (
                    <button
                        key={starValue}
                        type='button'
                        className={`${style.starButton} ${readonly ? style.readonly : ''}`}
                        onClick={() => handleClick(starValue)}
                        onMouseEnter={() => !readonly && setHoverRating(starValue)}
                        disabled={readonly}
                    >
                        <Star
                            size={size}
                            color={isFilled ? '#BFA030' : '#97979C'}
                            fill={isFilled ? '#FFCF00' : 'transparent'}
                            className={style.starIcon}
                        />
                    </button>
                );
            })}

        </div>
    )
};