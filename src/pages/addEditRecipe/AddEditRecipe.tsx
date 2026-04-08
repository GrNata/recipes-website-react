import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {ArrowLeft, Trash2, Plus, Save, X} from "lucide-react";
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { recipeApi } from "../../api/recipes.ts";
import { categoryApi } from "../../api/categories";
import {deleteImageFromServer, uploadRecipeImage} from "../../api/image";
import type { CategoryTypeDto, CategoryValueDto, IngredientDto, UnitDto, RecipeStatus } from '../../types';
import style from './AddEditRecipe.module.css';
import {dictionaryApi} from "../../api/dictionaries.ts";
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth} from "../../context/AuthContext.tsx";
import { ReferenceInfo} from "../../components/referenceInfo/ReferenceInfo.tsx";
import imageCompression from "browser-image-compression";


const AddEditRecipe: React.FC = () => {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);     //  Если есть id, значит редактируем

    // для АДМИНА
    const { user } = useAuth();
    // Проверяем, есть ли у пользователя роль ADMIN или MODERATOR ???
    const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('MODERATOR');

    const [errors, setErrors] = useState<Record<string, string>>({});

//     Главный стрейч формы
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [baseServings, setBaseServings] = useState<number | string>(1);
    const [image, setImage] = useState('');

    const [hours, setHours] = useState<number | ''>('');
    const [minutes, setMinutes] = useState<number | ''>('');

//     Динамический массив шагов (изначально 1 пустой шаг)
    const [steps, setSteps] = useState<string[]>(['']);

    // СТАТИЧЕСКИЕ ДАННЫЕ (Справочники)
    const [allTypes, setAllTypes] = useState<CategoryTypeDto[]>([]);
    const [allValues, setAllValues] = useState<CategoryValueDto[]>([]);
    const [allIngredients, setAllIngredients] = useState<IngredientDto[]>([]);
    const [allUnits, setAllUnits] = useState<UnitDto[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<any[]>([
        { ingredientId: '', amount: '', unitId: '' }
    ]);

    const [status, setStatus] = useState<RecipeStatus>('DRAFT');
    // const [totalCalories, setTotalCalories] = useState<number>(0);

    // ВЫБРАННЫЕ КАТЕГОРИИ (Храним только ID)
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    // для хранения технических полей при редактировании
    const [recipeMetadata, setRecipeMetadata] = useState<any>(null);

    const [isUploading, setIsUploading] = useState(false);

    // const [totalCalories, setTotalCalories] = useState(0);

    // Кнопка удалить фото
    // const [imageUrl, setImageUrl] = useState<string | null>(null);
    // const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const loadingDictionaries = async () => {
            try {
                // Загружаем категории
                const [types, values] = await Promise.all([
                    categoryApi.getTypes(),
                    categoryApi.getAllValues()
                ]);
                setAllTypes(types);
                setAllValues(values);

                // Загружаем ингредиенты и единицы измерения
                const  [ingrsResponse, unitsResponse] = await Promise.all([

                    dictionaryApi.getIngredients(),
                    dictionaryApi.getUnits()
                ]);

                // ПРОВЕРКА: Извлекаем массив из поля content, если бэкенд вернул Page
                // @ts-ignore
                const ingrsArray = ingrsResponse.content || ingrsResponse;
                // @ts-ignore
                const unitsArray = unitsResponse.content || unitsResponse;

                // Безопасно сохраняем только если это массивы
                if (Array.isArray(ingrsArray)) {
                    setAllIngredients(ingrsArray);
                } else {
                    console.error("Ингредиенты не являются массивом:", ingrsResponse);
                }

                if (Array.isArray(unitsArray)) {
                    setAllUnits(unitsArray);
                }

                console.log('AddEditRecipe: allIngredient: ', ingrsArray)
                console.log('AddEditRecipe: allUnits: ', unitsArray)
            } catch (e) {
                console.error("Ошибка загрузки справочников категорий или игредиентов", e);
            }
        };

        const fetchRecipeForEdit = async () => {
            //     Для редактирования рецепта
            if (isEdit && id) {
                try {

                    // Загружаем данные через API
                    const  recipeData = await recipeApi.getById(Number(id));

                    // Заполняем поля формы полученными данными
                    setName(recipeData.name);
                    setDescription(recipeData.description || '');
                    setBaseServings(recipeData.baseServings || 1);
                    setSteps(recipeData.steps.length > 0 ? recipeData.steps : ['']);
                    setImage(recipeData.image || '');

                    // Склеиваем часы и минуты в общее число минут
                    const totalCookingTime = (Number(hours) || 0) * 60 + (Number(minutes) ||  0);

                    // ????
                    if (recipeData.cookingTimeMinutes) {
                        setHours(Math.floor(recipeData.cookingTimeMinutes / 60));
                        setMinutes(recipeData.cookingTimeMinutes % 60);
                    }

                    // Сохраняем метаданные для UpdateRecipeRequest
                    // setStatus('DRAFT')
                    // При редактировании Админом - рецепт не имеет статус черновик или отклонен, будет на проверку или имевшийся опубликован
                    if (isAdmin && (recipeData.status === 'DRAFT' || recipeData.status === 'REJECTED')) {
                        recipeData.status = 'PENDING'
                    }
                    setStatus(recipeData.status); // БЕРЕМ РЕАЛЬНЫЙ СТАТУС ИЗ БД

                    setRecipeMetadata({
                        createdAt: recipeData.createdAt,
                        publishedAt: recipeData.publishedAt,
                        // status: status,
                        author: recipeData.author,
                        cookingTimeMinutes: totalCookingTime,
                        totalCalories: recipeData.totalCalories   //  ??? -
                    })

                    // Извлекаем ID уже выбранных категорий из объекта categoryValues
                    const existingIds = Object.values(recipeData.categoryValues)
                        .map(v => v.id);
                    setSelectedCategoryIds(existingIds);

                    // ингредиенты
                    if (recipeData.ingredients) {
                        const formattedIngredients = recipeData.ingredients.map(ing => ({
                            // Нужно брать ID именно из объекта продукта внутри связи
                            // Проверьте структуру вашего DTO (обычно это ing.ingredient.id)ingredientId: ing.id,
                            ingredientId: ing.id,
                            nameEng: ing.nameEng,
                            energyKcal100g: ing.energyKcal100g,
                            amount: ing.amount,
                            unitId: ing.unit?.id
                        }));
                        setSelectedIngredients(formattedIngredients);
                    }
                } catch (error) {
                    console.error("Ошибка загрузки рецепта для редактированрия: ", error);
                    alert("Не удалось загрузить данные рецепта");
                    // navigate('/my-recipes')
                    navigate(isAdmin ? '/admin/recipes' : '/my-recipes'); // СТАЛО с учетом АДМИНА
                }
            }
        };
        loadingDictionaries();
        fetchRecipeForEdit();
    }, [id, isEdit, navigate]);



    // ------- расчет КАЛОРИИ
//     const calculateTotalCalories = () => {
//         return selectedIngredients.reduce((sum, item) => {
//             const product = allIngredients.find(ing => ing.id === Number(item.ingredientId));
//             const amount = parseFloat(item.amount.toString().replace(',', '.'));
//
//             if (product && !isNaN(amount) && product.energyKcal100g) {
//                 // Расчет: (калории на 100г / 100) * количество
//                 // Учитываем, что расчет точен для единицы измерения "г" или "мл"
//                 return sum + (product.energyKcal100g / 100) * amount;
//             }
//             console.log('calculateTotalCalories: ', sum)
//
//             return sum;
//         }, 0);
//     };
//
//     const totalCalories = Math.round((calculateTotalCalories()));
    // setTotalCalories(Math.round((calculateTotalCalories())));

// Вычисляем калории автоматически. useMemo гарантирует, что перерасчет
// будет происходить ТОЛЬКО если изменились ингредиенты или загрузился справочник.
    const totalCalories = React.useMemo(() => {
        // 1. Защита при старте редактирования:
        // Если справочник продуктов еще пуст, но у нас есть данные рецепта из БД,
        // показываем сохраненное ранее значение калорий.
        if (allIngredients.length === 0 && recipeMetadata?.totalCalories) {
            return recipeMetadata.totalCalories;
        }

        // 2. Стандартный перерасчет
        const calculated = selectedIngredients.reduce((sum, item) => {
            console.log("calculated allUnit: ", allUnits)
            // Пропускаем пустые строки
            if (!item.ingredientId || !item.amount || !item.unitId) return sum;

            const product = allIngredients.find(ing => ing.id === Number(item.ingredientId));
            // Находим единицу измерения в справочнике
            const unit = allUnits.find(u => u.id === Number(item.unitId));
            // Надежно преобразуем запятую в точку
            const amount = parseFloat(String(item.amount).replace(',', '.'));

            console.log("calculated: product - ", product, ', unit - ', unit, ', amount - ', amount)

            // Проверяем, что всё нашлось и количество — это число, а также что у продукта есть калорийность
            if (product && unit && !isNaN(amount) && product.energyKcal100g) {

                let weightInGrams = 0;
                // Берем название ед.изм (предполагаем, что поле называется label, как у вас в <option>)
                // Переводим в нижний регистр для надежности
                // const unitName = (unit.label || unit.code || '').trim().toLowerCase();
                const unitName = (unit.label || '').trim().toLowerCase();

                console.log("calculated: product - ", product, ', unit - ', unit, ', amount - ', amount, ', unitName - ', unitName)
                // Переводим введенное количество в граммы
                if (unitName === 'г' || unitName === 'грамм') {
                    weightInGrams = amount;
                } else if (unitName === 'кг' || unitName === 'килограмм') {
                    weightInGrams = amount * 1000;
                } else if (unitName === 'мл' || unitName === 'миллилитр') {
                    weightInGrams = amount; // Условно считаем 1 мл = 1 г (для воды/молока это почти так)
                } else if (unitName === 'л' || unitName === 'литр') {
                    weightInGrams = amount * 1000; // 1 л = 1000 мл = 1000 г
                // } else
                    // if (unitName === 'шт' && product.name.toLowerCase() === 'Яйцо'.toLowerCase()) {
                    // console.log('Яйцо energyKcal100g - ', product.energyKcal100g)
                    // weightInGrams = product.energyKcal100g / 60 * 100;
                    // console.log('Яйцо weightInGrams = ', weightInGrams, 'energyKcal100g - ', product.energyKcal100g)
                } else {
                    // Если это "шт", "ст. л.", "щепотка" и т.д.
                    // Пока мы не умеем их считать, поэтому просто пропускаем этот ингредиент (возвращаем текущую сумму)
                    return sum;
                }

                // Рассчитываем калории: (калории на 100г / 100) * вес в граммах
                return sum + (product.energyKcal100g / 100) * weightInGrams;
            }

            return sum;
        }, 0);

        return Math.round(calculated);
    }, [selectedIngredients, allIngredients, recipeMetadata]);

    // обработка ингредиентов
    const handleAddIngredient =() => {
      setSelectedIngredients([...selectedIngredients, { ingredientId: '', amount: '', unitId: ''}]);
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

    const handleIngrChange = (index: number, field: string, value: any) => {
        const updated = [...selectedIngredients];
        updated[index][field] = value;
        setSelectedIngredients(updated);
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

    const removeIngredient = (index: number) => {
        setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
        // setTotalCalories(Math.round((calculateTotalCalories())));
    };

    // Обработка выбора категории
    const handleCategoryChange = (typeId: number, valueId: number) => {
        //     Находим все значения, которые могут относиться к этому типу(чтобы заменить старое на новое)
        const valuesOfThisType = allValues.filter(v => v.typeId === typeId)
            .map(v => v.id);
        setSelectedCategoryIds(prev => {
            //     Удаляем старое значение этого типа и добавляем новое
            const filtered = prev.filter(id => !valuesOfThisType.includes(id));
            return valueId === 0 ? filtered : [...filtered, valueId];
        });
    };

//     -----Логика шагов-----
    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);
    };

    const handleAddStep = () => {
        setSteps([...steps, '']);
    };

    const handleRemoveStep = (indexToRemove: number) => {
        if (steps.length === 1) return;     //  Оставляем хотя бы один шаг
        setSteps((steps.filter((_, index) => index !== indexToRemove)));
    };

    // Преобразуем наш справочник ИНГРЕДИЕНТОВ в формат для react-select
    const ingredientOptions = allIngredients.map(ing => ({
        value: ing.id,
        label: ing.name
    }));

//     изменения высоты поля ШАГОВ при увеличении текста
    const handleStepChangeHeight = (
        index: number,
        value: string,
        target: HTMLTextAreaElement) => {
        // 1. Обновляем текст в стейте
        const newSteps = [...steps];
        newSteps[index] = value;
        setSteps(newSteps);

        // 2. Сбрасываем высоту, чтобы она могла уменьшиться
        target.style.height = '30px';
        // 3. Устанавливаем новую высоту исходя из содержимого
        target.style.height = `${target.scrollHeight}px`;
    };

//     -------------------------------

//     Валидация перед сохранением
    // 1. Функция для проверки, является ли строка числом или дробью (2, 2.5, 2,5)
    const isValidAmount = (value: string): boolean => {
        const normalized = value.replace(',', '.'); // заменяем запятую на точку
        const num = parseFloat(normalized);

        // console.log("1 AMOUNT VALIDE: normalized - ", normalized, ' num - ', num)
        // console.log("2 AMOUNT VALIDE: !isNaN(num) && isFinite(num) && num > 0 - ", !isNaN(num) && isFinite(num) && num > 0)

        return !isNaN(num) && isFinite(num) && num > 0;
    };

    const validateFrom = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Название обязательно!';
        if (!description.trim()) newErrors.description = 'Добавьте хотя бы краткое описание';
        if (!baseServings || Number(baseServings) <= 0) newErrors.servings = 'Укажите количество порций.';

        // ВРЕМЯ ПРИГОТОВЛЕНИЯ > 0
        const totalMinutes = (Number(hours || 0) * 60) + Number(minutes || 0);
        if (totalMinutes <= 0) {
            newErrors.cookingTime = 'Укажите время приготовления (хотя бы приблизительно)';
        }

        // КАТЕГОРИИ
        // 1. Находим объект типа "Тип блюда" в справочнике типов
        // const dishType = allTypes.find(t => t.nameType.trim().toLowerCase() === 'тип блюда');

        // 2. Проверяем, есть ли в выбранных категориях хотя бы одна, чей typeId совпадает с ID "Типа блюда" typeId = 2
        const hasDishType = selectedCategoryIds.some(selectedId => {
            const val = allValues.find(v => v.id === selectedId);
            // return val?.typeId === dishType?.id;
            return val?.typeId === 2;
        });

        // 3. Если такой категории нет — записываем ошибку
        if (!hasDishType) { newErrors.categories = 'Выберите "Тип блюда"!'; }

    //     ИНГРЕДИЕНТЫ
    //     Проверка ингредиентов
        if (selectedIngredients.length === 0) {
            newErrors.ingredients = 'Добавьте хотя бы один ингредиент';
        } else {
            const hasInvalidIngredient = selectedIngredients.some(ing =>
                !ing.ingredientId || !ing.unitId || !isValidAmount(ing.amount)
            );
            if (hasInvalidIngredient) {
                newErrors.ingredients = 'Проверьте ингредиенты (название, ед. изм. и числовое количество (должно быть число))'
            }
        }

    //     ШАГИ
        const validSteps = steps.filter(s => s.trim() !== '');
        if (validSteps.length === 0) {
            newErrors.steps = "Опишите хотя бы один шаг приготовления";
        }

        setErrors(newErrors);
        // Если объект ошибок пуст, значит всё хорошо
        return Object.keys(newErrors).length === 0;
    };

//     ------- IMAGE -----------
//     обработчик выбора файла - IMAGE - функция сработает, как только пользователь выберет картинку на компьютере/телефоне
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        try {
            // 1. Настройки сжатия: 300x300 и конвертация в WebP
            const options = {
                maxSizeMB: 0.1,          // Максимальный вес: 100 Кб
                maxWidthOrHeight: 300,   // Тот самый любимый размер 300x300
                useWebWorker: true,      // Использовать фоновый процесс браузера
                fileType: 'image/webp'   // На выходе ВСЕГДА будет WebP
            };

            // 2. Сжимаем файл прямо в браузере!
            const compressedFile = await imageCompression(file, options);

            // 3. Отправляем уже СЖАТЫЙ файл на сервер
            const uploadeUrl = await uploadRecipeImage(compressedFile);

            setImage(uploadeUrl);
            toast.success('Фото успешно загружено!');
        } catch (e) {
            console.error("Ошибка при загрузке картинки ", e);
            toast.error("Не удалось загрузить фотографию");
        } finally {
            setIsUploading(false);
        }

      // const file = e.target.files?.[0];
      // if (!file) return;
      //
      //   setIsUploading(true);
      //
      // try {
      //     // Отправляем файл на сервер
      //     const uploadeUrl = await uploadRecipeImage(file);
      //
      //     // Сервер вернул путь (например, /uploads/recipes/123.jpg)
      //     // Обновляем наш основной стейт формы
      //     setImage(uploadeUrl);
      //     toast.success('Фото успешно загружено!');
      // } catch (e) {
      //     console.error("Ошибка при загрузке картинки ", e);
      //     toast.error("Не удалось загрузить фотографию");
      // } finally {
      //     setIsUploading(false);
      // }
    };

    // 2. Обработка удаления (нажатие на крестик/кнопку на превью)
    const handleDeleteImage = async () => {
        if (!image) return;

        // Спрашиваем подтверждение (по желанию)
        if (window.confirm(("Вы уверены, что хотите удалить это фото?"))) {
            try {
                // Вызываем наш новый метод бэкенда
                await deleteImageFromServer(image);
                // Очищаем состояние, чтобы скрыть картинку с экрана
                setImage('');

                // 3. (Опционально) Если вы используете react-hook-form или обычный input,
                // стоит сбросить значение самого input[type="file"], чтобы можно было выбрать тот же файл снова
                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

            } catch (error) {
                console.error("Не удалось удалить изображение", error);
                alert("Ошибка при удалении файла фото с сервера");
            }

        }
    };

//     --------------------

//     ----СОХРАНЕНИЕ-----
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log('1 Error SAVE: ', errors)
        console.log('1 Error SAVE validateFrom : ', validateFrom())

        if (!validateFrom()) {
            toast.error("Пожалуйста, заполните все обязательные поля корректно");
            console.log('2 Error SAVE: ', errors)

            // Ждем обновления стейта и находим первый элемент с классом ошибки
            // Скролл к первой ошибке
            setTimeout(() => {
                const firstErrorField = document.querySelector(`.${style.inputError}, .${style.sectionError}`);
                if (firstErrorField) {
                    // firstErrorField.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }
        // Форматируем ингредиенты согласно вашим Request DTO
        console.log('SelectedIngredients: ', selectedIngredients)

        // Подготовка данных (чистка пустых шагов и нормализация чисел)
        const formattedIngredients = selectedIngredients
            .filter(ing => ing.ingredientId !== '')
            .map(ing => ({
                ingredientId: Number(ing.ingredientId),
                // amount: ing.amount.replace(',', '.'), // сервер ждет точку
                amount: parseFloat(ing.amount.replace(',', '.')), // сервер ждет точку
                unitId: Number(ing.unitId)
        }));

        console.log('FormattedIngredients: ', formattedIngredients)

        // Очищаем шаги от пустых строк
        const cleanSteps = steps.filter(step => step.trim() !== '');

        let updateRequest;
        let createRequest;

        const totalCookingTime = (Number(hours) || 0) * 60 + (Number(minutes) ||  0);

            if (isEdit && recipeMetadata) {

                // Формируем UpdateRecipeRequest
                updateRequest = {
                    id: Number(id),
                    name: name,
                    description: description,
                    image: image,
                    createdAt: recipeMetadata.createdAt,
                    publishedAt: recipeMetadata.publishedAt,
                    // status: recipeMetadata.status,      //      ???
                    // ИСПРАВЛЕНИЕ: Если Админ - берем из стейта. Если юзер - сбрасываем в DRAFT
                    status: isAdmin ? status : 'DRAFT',
                    author: recipeMetadata.author,
                    baseServings: Number(baseServings),
                    cookingTimeMinutes: totalCookingTime,
                    categoryIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //          ???
                    totalCalories: totalCalories
                };
                console.log('UPDATE: ', updateRequest)

            } else  {
                // Формируем CreateRecipeRequest
                createRequest = {
                    name,
                    description,
                    image,
                    baseServings: Number(baseServings),
                    cookingTimeMinutes: totalCookingTime,
                    categoryValueIds: selectedCategoryIds,
                    ingredients: formattedIngredients,
                    steps: cleanSteps,      //      ???
                };
                console.log('CREATE: ', createRequest)
            }

        // Создаем "обещание" (promise) для сохранения
        const savePromise = isEdit
            ? recipeApi.updateRecipe(Number(id), updateRequest)
            : recipeApi.createRecipe(createRequest);

        // toast.promise сам покажет лоадер, а потом успех или ошибку
        toast.promise(savePromise, {
            loading: 'Сохраняем рецепт...',
            success: isEdit ? 'Рецепт сохранен! ✨\'' : 'Создан черновик рецепта, можно отправить на публикацию! 🚀',
            error: 'Ошибка при сохранении. Проверте данные. ❌',
        });

            try {
                await savePromise;
                // navigate('/my-recipes');
                navigate(isAdmin ? '/admin/recipes' : '/my-recipes'); // СТАЛО + ADMIN
            } catch (error) {
            console.error("Ошибка при сохранении:", error);
            console.error("Ошибка при сохранении: createRequest", createRequest);
            console.error("Ошибка при сохранении: updateRequest", updateRequest);
            // alert("Alert: Не удалось сохранить рецепт. Проверьте заполнение всех обязательных полей.");
        }
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <div className={style.container}>
            {/*     Шапка   */}
            <div className={style.headerRow}>
                <button onClick={() => navigate(-1)} className={style.btnBack}>
                    <ArrowLeft size={20} /> Назад
                </button>
                <h1 className={style.title}>
                    {isEdit ? 'Редактировать рецепт' : 'Создать рецепт'}
                </h1>
            </div>

            <form onSubmit={handleSave}>
                {/* ВЕРХНЯЯ ЧАСТЬ: ДВЕ КОЛОНКИ */}
                <div className={style.topGrid}>

                    {/* ЛЕВАЯ КОЛОНКА */}
                    <div className={style.leftCol}>
                        <div className={style.formGroup}>
                            <label className={style.label}>
                                Название
                                <span className={style.requiredStar}>*</span>
                            </label>
                            <div className={style.tooltipContainer}>
                                    < input
                                        type="text"
                                        className={`${style.input} ${errors.name ? style.inputError : ''}`}
                                        value={name}
                                        onChange={e => {
                                            setName(e.target.value);
                                            // if (errors.name) setErrors(prev => ({ ...prev, name: ''})); // Убираем ошибку при вводе
                                        }}
                                        // required
                                        // title='Поле обязательное для заполнения, введите название рецепта.'
                                    />
                                {/*</div>*/}
                                {/* Текст подсказки */}
                                <span className={style.tooltipText}>
                                    Поле обязательное для заполнения, введите название рецепта.
                                </span>

                                {errors.name && <span className={style.errorMessage}>{errors.name}</span>}
                            </div>
                        </div>


                        <div className={style.formGroup}>
                            <label className={style.label}>
                                Описание
                                <span className={style.requiredStar}>*</span>
                            </label>
                            <div className={style.tooltipContainer}>
                                <textarea
                                    className={style.textarea}
                                    value={description}
                                    onChange={e => {
                                        setDescription(e.target.value);
                                        // if (errors.description) setErrors(prev => ({ ...prev, description: ''}));
                                    }}
                                    // required
                                    // title='Поле обязательное для заполнения, введите описание рецепта.'
                                ></textarea>

                                {/* Текст подсказки */}
                                <span className={style.tooltipText}>
                                    Поле обязательное для заполнения, введите описание рецепта.
                                </span>
                                {errors.description && <span className={style.errorMessageDesc}>{errors.description}</span>}
                            </div>
                        </div>

                        {/*   ------     IMAGE  ------- */}
                        <div className={style.formGroup}>
                            <label className={style.label}>Фото рецепта</label>

                            {/* Показываем превью картинки, если она уже загружена */}
                            {/*  Или сравнение с ''  image != ''   */}
                            {image ? (
                                /* РЕЖИМ ПРЕВЬЮ: Картинка уже есть */
                                <div className={style.imagePreviewBlock }>
                                    <div className={style.imageContainer }>
                                        <img
                                            // ВАЖНО: Если сервер возвращает локальный путь (без http),
                                            // нам нужно подставить базовый URL бэкенда для отображения
                                            src={getImageUrl(image)}   // Укажите порт вашего бэкенда!
                                            alt="Превью рецепта"
                                            className={style.imagePreviewContent}
                                        />
                                        {/* Кнопка удаления поверх фото или под ним */}
                                        <button
                                            type='button'
                                            onClick={handleDeleteImage}
                                            className={style.deleteImageBtn}
                                            title="Удалить фото"
                                        >
                                            {/*Удалить фото*/}
                                            <X size={20} strokeWidth={3}/>     {/* strokeWidth сделает крестик жирнее */}
                                        </button>
                                    </div>
                                    <p className={style.uploadStatus}>
                                        Файл загружен на сервер
                                    </p>
                                    {/*</div>*/}
                                </div>
                                ) : (
                            // )}
                            //  Само поле для выбора файла - РЕЖИМ ВЫБОРА: Картинки нет
                                <div className={style.uploadWrapper}>
                                    <div className={style.tooltipContainer}>
                                        <input
                                            type="file"
                                            className={style.input}
                                            onChange={handleImageChange}
                                            disabled={isUploading}
                                            placeholder="https://...mage/jpeg, image/png, image/webp"
                                            // ДОБАВЛЯЕМ АТРИБУТ ACCEPT:
                                            // accept="image/jpeg, image/png, image/webp"  - webp не поддерживает Thumbnailator при сжатии
                                            accept="image/jpeg, image/png, image/webp"
                                            // Вот эта строка создаст всплывающую подсказку:
                                            // title="Выберите фото (JPG, JPEG, PNG, WebP). Максимальный размер файла — 5 МБ."
                                        />
                                            {/* Текст подсказки */}
                                        <span className={style.tooltipText}>
                                            Выберите фото (JPG, JPEG, PNG, WebP). Максимальный размер файла — 5 МБ.
                                            {/*Выберите фото (JPG, JPEG, PNG). Максимальный размер файла — 5 МБ.*/}
                                        </span>

                                        {isUploading && (
                                            <span style={{ marginLeft: '10px', color: '#41728F'}}>
                                                Загружаем... ⏳
                                            </span>
                                        )}
                                    </div>
                                </div>
                        )}
                        </div>
                        {/*     ------------        */}

                        {/*     Количество порций   */}
                        <div className={style.formGroup}>
                            <div className={style.formRow}>
                                <div className={style.blockQuantity}>
                                    <label className={style.label}>
                                        Количество порций
                                        <span className={style.requiredStar}>*</span>
                                    </label>
                                    <div style={{ paddingTop: '10px'}}>
                                        <div className={style.tooltipContainer}>
                                            <input
                                                type="number"
                                                className={style.inputQuantity}
                                                value={baseServings}
                                                onChange={e => setBaseServings(e.target.value)}
                                                // required
                                                title='Поле обязательное для заполнения, введите количество порций для указанного количества ингредиентов.'
                                            />
                                            <div style={{padding: '5px'}}>
                                                {errors.servings && <span className={style.errorMessage} >{errors.servings}</span>}
                                            </div>
                                            {/* Текст подсказки */}
                                            <span className={style.tooltipText}>
                                                Поле обязательное для заполнения, введите количество порций для указанного количества ингредиентов.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            {/*</div>*/}

                            {/*     Время приготовления */}
                            {/*<div className={style.formGroup}>*/}
                                <div className={style.blockQuantity} >
                                    <label className={style.label} >
                                        Время приготовления
                                        <span className={style.requiredStar}>*</span>
                                    </label>

                                    {/* Внешний контейнер: теперь это колонка (ошибка будет под инпутами) */}
                                    {/*<div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>*/}
                                    {/* РЯД: Часы и минуты в одну линию - Контейнер-колонка: сверху инпуты, снизу ошибка */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', paddingTop: '10px' }}>

                                                {/* Блок часов */}
                                                <div style={{ display:'flex', gap: '15px', alignItems:'center'}}>
                                                    <div className={style.tooltipContainer}>
                                                        <input
                                                            type='number'
                                                            min="0"
                                                            max="72"
                                                            placeholder='Часы'
                                                            value={hours}
                                                            onChange={(e) => setHours(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                                                            className={`${style.inputTime} ${errors.cookingTime ? style.inputError : ''}`}
                                                            title='Поле обязательное для заполнения, введите часы.'
                                                        />
                                                        <span> ч</span>
                                                            {/* Текст подсказки */}
                                                        <span className={style.tooltipText}>
                                                            Поле обязательное для заполнения, введите часы.
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Блок минут */}
                                                <div style={{ display:'flex', alignItems: 'center', gap: '5px'}}>
                                                    <div className={style.tooltipContainer}>
                                                        <input
                                                            type='number'
                                                            min="0"
                                                            max="59"
                                                            placeholder='Минуты'
                                                            value={minutes}
                                                            className={`${style.inputTime} ${errors.cookingTime ? style.inputError : ''}`}
                                                            onChange={(e) => setMinutes(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                                                            // title='Поле обязательное для заполнения, введите минуты.'
                                                        />
                                                        <span> мин</span>
                                                            {/* Текст подсказки */}
                                                        <span className={style.tooltipText}>
                                                            Поле обязательное для заполнения, введите минуты.
                                                        </span>
                                                    </div>
                                                </div>
                                            <div >
                                        {/*</div>*/}
                                                {/* ВТОРАЯ СТРОКА: ОШИБКА: Под всем рядом инпутов */}
                                        {/*{errors.cookingTime && (*/}
                                        {/*    <div style={{ marginTop: '5px' }}>*/}
                                        {/*        <span className={style.errorMessage}>{errors.cookingTime}</span>*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
                                    </div>
                                        {/*</div>*/}
                                </div>

                            </div>
                        </div>

                            </div>

                            {errors.cookingTime && (
                                <div style={{ marginTop: '5px' }}>
                                    <span className={style.errorMessage} style={{paddingLeft: '80px'}}>{errors.cookingTime}</span>
                                </div>
                            )}

                        </div>

                    </div>
                {/*</div>*/}

                {/* ПРАВАЯ КОЛОНКА (КАТЕГОРИИ) */}
                {/*    Категории (Фильтруем typeId=1 (убираем Быстрые) и подсвечиваем typeId=2 - Тип блюда):*/}
                    <div className={`${style.categoriesScrollArea} ${errors.categories ? style.sectionError : ''}`}>
                        {allTypes
                            .filter(type => type.id !== 1) // Убираем "Быстрые" с экрана
                            .map(type => {
                                const isDishType = type.id === 2;
                                const currentValId = selectedCategoryIds.find(id =>
                                    allValues.find(v => v.id === id)?.typeId === type.id
                                );

                                return (
                                    <div key={type.id} className={style.categoryMiniCard}>
                                        <div>
                                        <span className={style.categoryLabel}>
                                            {type.nameType} {isDishType && <span style={{color: 'red'}}>*</span>}
                                        </span>
                                        </div>
                                        <div className={style.tooltipContainer}>
                                            <select
                                                className={`${style.categorySelect} ${isDishType && errors.categories ? style.inputError : ''}`}
                                                value={currentValId || ""}
                                                onChange={(e) => handleCategoryChange(type.id, Number(e.target.value))}
                                                // title={isDishType ? 'Поле обязательное для заполнения, выберите категорию из Типа блюд.' : ''}
                                            >
                                                <option value="">-- Выбрать --</option>
                                                {allValues.filter(v => v.typeId === type.id).map(v => (
                                                    <option key={v.id} value={v.id}>{v.categoryValue}</option>
                                                ))}

                                            </select>
                                            {/* Текст подсказки */}
                                            {isDishType ? (
                                                <span className={style.tooltipText}>
                                                    Поле обязательное для заполнения, выберите категорию из Типа блюд.
                                                </span>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        {errors.categories && <span className={style.errorMessage}>{errors.categories}</span>}
                    </div>
                </div>

                {/* НИЖНИЕ БЛОКИ */}

                {/*     ИНГРЕДИЕНТЫ      */}
                {/* Для блоков ингредиентов и категорий можно подсвечивать заголовки секций */}
                <div className={style.fullWidthSection}>
                    <div className={style.tooltipContainer}>
                        <h3
                            className={`${style.sectionTitle} ${errors.ingredients ? style.errorSection : ''}`}
                            // title='Обязательно для заполнения, добавьте ингредиенты.'
                        >
                            Ингредиенты
                            <span className={style.requiredStar}>*</span>
                        </h3>
                        {errors.ingredients && <span className={style.errorMessage}>{errors.ingredients}</span>}
                        {/* Текст подсказки */}
                        <span className={style.tooltipText}>
                            Обязательно для заполнения, добавьте ингредиенты.
                        </span>

                    {/*  Компонент-шпаргалка   */}
                        <span style={{ paddingLeft: '20px', paddingTop: '10px'}}><ReferenceInfo  /></span>
                    </div>

                    <div className={style.caloriesInfo}>
                        Общая калорийность: <strong>{totalCalories} ккал</strong>
                        <p> (в расчет калорийности входят только ингредиенты, у которых указанна единица измерения: кг, г, л, мл. )</p>
                    </div>

                    {/*---- ИНГРЕДИЕНТЫ ---------*/}
                    <div className={style.ingredientsTable}>
                        <div className={style.tableHeader}>
                            <span>Продукт</span>
                            <span>Кол-во</span>
                            <span>Ед. изм.</span>
                            <span></span>
                        </div>

                        <div className={`${errors.ingredients ? style.sectionError : ''}`}>
                            {selectedIngredients.map((item, index) => (
                                <div key={index} className={style.ingredientRow} style={{ minWidth: 0 }}>
                                    <Select
                                        options={ingredientOptions}
                                        placeholder="Поиск..."
                                        isSearchable={true}
                                        // Ищем выбранный элемент в массиве options
                                        value={ingredientOptions.find(opt => opt.value === Number(item.ingredientId)) || null}
                                        // Передаем выбранный ID в ваш старый обработчик
                                        onChange={(selectedOption) => handleIngrChange(index, 'ingredientId', selectedOption ? selectedOption.value : '')}
                                        noOptionsMessage={() => "Не найдено"} // Текст, если поиск ничего не дал
                                        styles={{
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                // backgroundColor: '#F7F0EC',
                                                // borderColor: state.isFocused ? '#AC3B61' : '#ccc',
                                                backgroundColor: 'var(--input-bg)',
                                                borderColor: state.isFocused ? 'var(--accent-main)' : 'var(--border-color)',
                                                minHeight: '50px',
                                                borderRadius: '6px',
                                                boxShadow: 'none', // Убираем стандартное синее свечение браузера
                                                '&:hover': {
                                                    // borderColor: '#AC3B61'
                                                    borderColor: 'var(--accent-main)'
                                                },
                                                cursor: 'pointer'
                                            }),
                                            menu: (baseStyles) => ({
                                                ...baseStyles,
                                                zIndex: 9999, // Чтобы выпадающий список был поверх всего
                                                // backgroundColor: '#F7F0EC',
                                                backgroundColor: 'var(--input-bg)',
                                                border: '1px solid var(--border-color)'
                                            }),
                                            option: (baseStyles, state) => ({
                                                ...baseStyles,
                                                // backgroundColor: state.isFocused ? '#EEE2DC' : 'transparent',
                                                // color: '#123C69',
                                                backgroundColor: state.isFocused ? 'var(--card-hover)' : 'transparent',
                                                color: 'var(--input-text)',
                                                cursor: 'pointer',
                                                '&:active': {
                                                    // backgroundColor: '#D2787A'
                                                    backgroundColor: 'var(--accent-main)'
                                                }
                                            }),

                                        //     ????????????
                                            singleValue: (baseStyles) => ({
                                                ...baseStyles,
                                                color: 'var(--input-text)'
                                            }),
                                            input: (baseStyles) => ({
                                                ...baseStyles,
                                                color: 'var(--input-text)'
                                            })
                                        //     ????????????
                                        }}
                                    />
                                {/*<div key={index} className={style.ingredientRow}>*/}
                                {/*/!*    Выбор ингредиента из словаря     *!/*/}
                                {/*    <select*/}
                                {/*        className={style.ingrSelect}*/}
                                {/*        value={item.ingredientId}*/}
                                {/*        onChange={(e) => handleIngrChange(index, 'ingredientId', Number(e.target.value))}*/}
                                {/*    >*/}
                                {/*        <option value="">-- Выбрать ингредиент --</option>*/}
                                {/*        {allIngredients.map(ing => (*/}
                                {/*            <option key={ing.id} value={ing.id}>{ing.name}</option>*/}
                                {/*        ))}*/}
                                {/*    </select>*/}

                                {/*    Ввод количества  */}
                                {/*    Ингредиенты (валидация количества):*/}
                                    <input
                                        type="text"
                                        placeholder="Кол-во"
                                        className={`${style.amountInput} ${!isValidAmount(item.amount) && item.amount !== '' ? style.inputError : ''}`}
                                        value={item.amount}
                                        onChange={(e) => handleIngrChange(index, 'amount', e.target.value)}
                                    />

                                {/*    Выбор Unit   */}
                                    <select
                                        className={style.unitSelect}
                                        value={item.unitId}
                                        onChange={(e) => handleIngrChange(index, 'unitId', Number(e.target.value))}
                                    >
                                        <option value="">--</option>
                                        {allUnits.map(unit => (
                                            <option key={unit.id} value={unit.id ?? "" }>{unit.label}</option>
                                        ))}
                                    </select>

                                    <div className={style.tooltipContainer}>
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(index)}
                                            className={style.btnIconDelete}
                                            // title='Удалить ингредиент.'
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                        {/* Текст подсказки */}
                                        <span className={style.tooltipText}>
                                            Удалить ингредиент.
                                        </span>
                                    </div>
                                </div>

                            ))}
                        {errors.ingredients && <span className={style.errorMessage}>{errors.ingredients}</span>}
                        </div>
                    </div>

                    <button type="button" onClick={handleAddIngredient} className={style.btnAddSmall}>
                        <Plus size={16} /> Добавить ингредиент
                    </button>
                </div>

                {/*     ШАГИ     */}
                <div className={style.fullWidthSection}>
                    <div className={style.tooltipContainer}>
                        <h3
                            className={`${style.sectionTitle} ${errors.steps ? style.errorSection : ''}`}
                            // title='Обязательно для заполнения, добавьте шаги приготовления.'
                        >
                            Шаги приготовления
                            <span className={style.requiredStar}>*</span>
                        </h3>
                            {/* Текст подсказки */}
                            <span className={style.tooltipText}>
                                Обязательно для заполнения, добавьте шаги приготовления.
                            </span>
                    </div>
                    {/*{errors.steps && <span className={style.errorMessage}>{errors.steps}</span>}*/}

                    {steps.map((step, index) => (
                        <div key={index} className={style.stepRow}>
                            <div className={style.stepNumber} >{index + 1}</div>
                            <textarea
                                // required
                                className={style.stepTextarea}
                                style={{ width: "90%", minHeight: '38px', fontSize: '0.9rem', resize: 'none'}}      // resize: none убирает ручное растягивание
                                value={step}
                                onChange={(e) => {
                                    handleStepChange(index, e.target.value);
                                    handleStepChangeHeight(index, e.target.value, e.target)
                                }}
                            />
                            <div className={style.tooltipContainer}>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStep(index)}
                                    // className={style.btnDelete}
                                    className={style.btnIconDelete}
                                    // title='Удалить шаг приготовления.'
                                    // style={{backgroundColor: "#F7F0EC", color: '#123C69', border: 'solid 1.1px', borderColor: '#24678F', height: '38px'}}
                                >
                                    <Trash2 size={17}/>
                                </button>
                                {/* Текст подсказки */}
                                <span className={style.tooltipText}>
                                    Удалить шаг приготовления.
                                </span>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddStep} className={style.btnAdd}><Plus size={18}/> Добавить шаг</button>
                </div>
                {errors.steps && <span className={style.errorMessage}>{errors.steps}</span>}

                {/* Информационный блок - об опубликовании рецепта */}
                {/*{!isAdmin && (*/}
                    <div className={style.statusInfoBox}>
                        <p>
                            <strong>Обратите внимание:</strong> после сохранения рецепт получит статус
                            <span className={style.draftText}> "Черновик"</span>
                            Чтобы он появился в общем поиске, не забудьте отправить его на модерацию из раздела "Мои рецепты" (кнопка на карточке рецепта - "флажок").
                        </p>
                    </div>
                {/*)}*/}


                <div className={style.actonRow}>
                    <button type="submit" className={style.btnSave}>
                        <Save size={20} className={style.saveIcon} />
                        {isEdit ? "Сохранить изменения" : "Сохранить рецепт"}
                    </button>
                </div>

            </form>
        </div>
    )
};


export default AddEditRecipe;