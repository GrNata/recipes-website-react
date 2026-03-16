// Компонент-шпаргалка
// аккуратную иконку с вопросиком, при клике на которую будет всплывать красивое окошко с подсказками.

import React, { useState} from "react";
import style from './ReferenceInfo.module.css';

export const ReferenceInfo: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={style.mainContainer}>
            {/* Красивая круглая кнопка */}
            <button
                type='button'
                onClick={() => setIsOpen(!isOpen)}
                className={style.btnOpen}
                title='Справочник мер и весов'
            >
                ?
            </button>


            {/* Затемнение фона для мобилок (показываем только если открыто) */}
            {isOpen &&  <div className={style.overlay} onClick={() => setIsOpen(false)}></div>}

            {/* Само всплывающее окно */}
            {isOpen && (
                <div className={style.prover}>
                    <h4 className={style.title}>Полезные соотношения</h4>
                    <ul className={style.ul}>
                        <li><b>1 ст. ложка</b> = 3 ч. ложки ≈ 15-20 г</li>
                        <li><b>1 стакан</b> = 16 ст. ложек ≈ 200-250 г</li>
                        {/*<li><b>1 жидкая унция (fl oz)</b> = 2 ст. ложки ≈ 30 мл</li>*/}
                        <li><b>1 щепотка</b> ≈ 1-2 грамма</li>
                        <li><b>1 пучок (зелень)</b> ≈ 30-50 граммов</li>
                    </ul>
                    <button
                        onClick={() => setIsOpen(false)}
                        className={style.btnClose}
                    >
                        Закрыть
                    </button>
                </div>
            )}
        </div>
    )
}