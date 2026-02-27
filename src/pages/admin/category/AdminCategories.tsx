import React, { useState, useEffect } from "react";
import { adminApi } from "../../../api/admin";
import {Trash2, Plus, ListFilter, Edit, Save, X} from "lucide-react";
import { toast } from "react-hot-toast";
import style from './AdminCategories.module.css';
import type { CategoryValueDto, CategoryTypeDto } from "../../../types";

const AdminCategories: React.FC = () => {
    const [types, setTypes] = useState<CategoryTypeDto[]>([]);
    const [selectedType, setSelectedType] = useState<CategoryTypeDto | null>(null);
    const [values, setValues] = useState<CategoryValueDto[]>([]);
    const [selectedValues, setSelectedValues] = useState<CategoryValueDto[]>([]);

    // Стейты для добавления
    const [newValueName, setNewValueName] = useState('');
    // const [formDataValue, setFormDataValue] = useState({ typeId: 0, typeName: '', categoryValue: '' });
    const [newTypeName, setNewTypeName] = useState('');
    const [isCreatingType, setIsCreatingtype] = useState(false);

    // Стейты для редактирования
    const [editValueId, setEditValueId] = useState<number | null>(null);
    const [editValueText, setEditValueText] = useState('');
    const [editTypeId, setEditTypeId] = useState<number | null>(null);
    const [editTypeText, setEditTypeText] = useState('');

    const loadData = () => {
        adminApi.getAllCategoryValues().then(setValues).catch(console.error);
        adminApi.getCategoryTypes().then(setTypes).catch(console.error);
    };

    // Загрузка
    useEffect(() => {
        loadData();
    }, []);

    // Загрузка значений при смене типа
    useEffect(() => {
        if (selectedType) {
            // const valueByType = values.filter(v => v.typeId === selectedType.id);
            setSelectedValues(values.filter(v => v.typeId === selectedType.id));
        } else {
            setSelectedValues([]);
        }
    }, [selectedType, values]);

    // ================= ТИПЫ КАТЕГОРИЙ (Левая колонка) =================

    const handleCreateType = async  () => {
      if (!newTypeName.trim()) return;
      try {
          await adminApi.createCategoryType({ nameType: newTypeName });
          setNewTypeName('');
          setIsCreatingtype(false);
          loadData();
          toast.success('Тип категории созлан');
      } catch (e) {
          toast.error('Ошибка при создании типа категории');
          console.error('Ошибка при создании типа категории ', e);
      }
    };

    const handleUpdateType = async (id: number) => {
      if (!editTypeText)  return;
      try {
          await adminApi.updateCategoryType(id, { nameType: editTypeText });
          setEditTypeId(null);

          // Если мы редактировали выбранный тип, обновляем и его локально
          if (selectedType?.id === id) {
              setSelectedType({ ...selectedType, nameType: editTypeText});
          }
          loadData();
          toast.success('тип категории обновлен')
      } catch (e) {
          toast.error('Ошибка обновления типа категории');
          console.error('Ошибка обновления типа категории ', e);
      }
    };

    const handleDeleteType = async (id: number) => {
        if (!window.confirm('Удалить тип категории? ВСЕ вложенные значения категорий и рецепты, относящиеся к нему, тоже могут быть удалены!!!')) return;
        try {
            await adminApi.deleteCategoryType(id);
            if (selectedType?.id === id) setSelectedType(null);
            loadData();
            toast.success('Тип категории удален')
        } catch (e) {
            toast.error('Ошибка удаления типа категории');
            console.error('Ошибка удаления типа категории ', e);
        }
    };

    // ================= ЗНАЧЕНИЯ КАТЕГОРИЙ (Правая колонка) =================

    const handleAddValue = async (e: React.FormEvent) => {
        e.preventDefault();

        console.log("handleAddValue: selectedType = ", selectedType, ' newValueName = ', newValueName)

        if (!selectedType || !newValueName.trim()) return;

        try {
            await adminApi.createCategoryValue({ typeId: selectedType.id, typeName: selectedType.nameType, categoryValue: newValueName});
            setNewValueName('');
            loadData();
        //     Обновляем список
        //     const updatedValues = await adminApi.getAllCategoryValues();
        //     console.log("handleAddValue: updatedValues = ", updatedValues)
        //
        //     setValues(updatedValues);
        //
        //     console.log("handleAddValue: values = ", values)

            toast.success('Значение категории добавлено.');
        } catch (e) {
            toast.error('Ошибка при добавлении значения категории.');
            console.error('Ошибка при добавлении значения категории.', e);
        }
    };

    const handleUpdateValue = async (val: CategoryValueDto) => {
        if (!editValueText.trim()) return;
        try {
            await adminApi.updateCategoryValue(val.id, { typeId: val.typeId, typeName: val.typeName, categoryValue: editValueText });
            setEditValueId(null);
            loadData();
            toast.success('Значение категории обновлено');
        } catch (e) {
            toast.error('Ошибка обновления значения категории');
            console.error('Ошибка обновления значения категории ', e);
        }
    };

    const handleDeleteValue = async (id: number) => {
        if (!window.confirm('Удалить это значение категории? Рецепты могут потерять это значение категории!')) return;
        try {
            await adminApi.deleteCategoryValue(id);
            loadData();
            toast.success('Удалено!');
        } catch (e) {
            toast.error('Ошибка при удалении значения категории ');
            console.error('Ошибка при удалении значения категории ', e);
        }
    };

    return (
        <div className={style.container}>
            {/* Левая колонка - Типы */}
            <div className={style.sidebar}>
                <h3 style={{ color: '#123C69' }}>Типы категорий</h3>

                {types.map(type => (
                    <div
                        key={type.id}
                        className={`${style.typeItem} ${selectedType?.id === type.id ? style.activeType : ''}`}
                        // onClick={() => setSelectedType(type)}
                    >

                        {/* Режим редактирования ТИПА */}
                        {editTypeId === type.id ? (
                            <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                <input
                                    autoFocus
                                    value={editTypeText}
                                    onChange={(e) => setEditTypeText(e.target.value)}
                                    style={{ flexGrow: 1, padding: '4px'}}
                                />
                                <button
                                    onClick={() => handleUpdateType(type.id)}
                                    style={{ background: 'none', border: 'none', color: 'green', cursor: 'pointer'}}
                                >
                                    <Save size={16} />
                                </button>
                                <button
                                    onClick={() => setEditTypeId(null)}
                                    style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}
                                >
                                    <X size={16} />
                                </button>
                             </div>
                        ) : (
                        // Обычный режим отображения ТИПА
                        <div
                            style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}
                            onClick={() => setSelectedType(type)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center'}}>
                                {(type.id === 1 || type.id === 2) && (
                                    <>🔒 {type.nameType}</>
                                )}
                                {(type.id > 2) && (
                                    <>
                                        <ListFilter size={18} style={{ marginRight: '8px'}} />
                                        {type.nameType}
                                    </>
                                )}
                            </span>

                            {/* Показываем иконки управления только если тип выбран */}
                            {/* Показываем иконки управления только если тип выбран И он не системный (ID > 2) */}
                            {selectedType?.id === type.id && type.id > 2 && (
                                <span style={{ display: 'flex', gap: '2px', paddingRight: '10px'}}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditTypeText(type.nameType); setEditTypeId(type.id)}}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer'}}
                                    >
                                        <Edit size={16} color='white' />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteType(type.id)}}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer'}}
                                    >
                                        <Trash2 size={16} color='white' style={{paddingRight: '15px'}} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                 </div>
                ))}

                {/* ДОБАВЛЕНИЕ НОВОГО ТИПА */}
                {isCreatingType ? (
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px'}}>
                        <input
                            autoFocus
                            placeholder='название типа...'
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            style={{ flexGrow: 1, padding: '4px'}}
                        />
                        <button
                            onClick={handleCreateType}
                            style={{background: 'none', border: 'none', color: 'green', cursor: 'pointer'}}
                        >
                            <Save size={16} />
                        </button>
                        <button
                            onClick={() => setIsCreatingtype(false)}
                            style={{background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreatingtype(true)}
                        style={{ marginTop: '15px', background: 'none', border: '1px dashed #123C69', color:'#123C69', width: '100%', padding: '8px', borderRadius: '4px', cursor: 'pointer'}}
                    >
                        + Добавить тип
                    </button>
                )}
            </div>

            {/*    /!* Правая колонка - Значения *!/*/}
            <div className={style.mainArea}>
                {selectedType ? (
                    <>
                        <h2 style={{ color: '#AC3B61'}}>{selectedType.nameType}</h2>

                        <form onSubmit={handleAddValue} className={style.addForm}>
                            <input
                                className={style.input}
                                placeholder={'Название нового значения категории...'}
                                value={newValueName}
                                onChange={(e) => setNewValueName(e.target.value)}
                            />
                            <button type='submit' className={style.btnAdd}>
                                <Plus size={18} />   Добавить
                            </button>
                        </form>

                        <div className={style.valueList}>
                            {selectedValues.map(val => (
                                <div key={val.id}
                                     className={style.valueRow}
                                     style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee'}}
                                >

                                    {/* Режим редактирования ЗНАЧЕНИЯ */}
                                    {editValueId === val.id ? (
                                        <div style={{ display: 'flex', gap: '10px', flexGrow: 1}}>
                                            <input
                                                autoFocus
                                                value={editValueText}
                                                onChange={(e) => setEditValueText(e.target.value)}
                                                style={{ flexGrow: 1, padding: '4px'}}
                                            />
                                            <button
                                                onClick={() => handleUpdateValue(val)}
                                                style={{ background: 'none', border: 'none', color: 'green', cursor: 'pointer'}}
                                            >
                                                <Save size={18} />
                                            </button>
                                            <button
                                                onClick={() => setEditValueId(null)}
                                                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer'}}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {val.id === 1 && (
                                                <><span>🔒 {val.categoryValue}</span></>
                                            )}
                                            {val.id !== 1 && (
                                                <><span>{val.categoryValue}</span></>
                                            )}

                                            {/* Скрываем кнопки редактирования/удаления для значения с ID = 1 */}
                                            {val.id !== 1 && (
                                                <div>
                                                    <button
                                                        onClick={() => { setEditValueText(val.categoryValue); setEditValueId(val.id) }}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px'}}
                                                    >
                                                        <Edit size={18} color='#123C69' />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteValue(val.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer'}}
                                                    >
                                                        <Trash2 size={18} color='#DF3030' />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}


                                </div>
                            ))}
                            {selectedValues.length === 0 &&
                                <p style={{ color: '#999', marginTop: '20px'}}>
                                    В этом типе категорий пока нет значений
                                </p>
                            }
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#666'}}>
                        Выберите тип категории слева, чтобы управлять значениями
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminCategories;