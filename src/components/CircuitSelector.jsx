import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@services/supabase';
import './CircuitSelector.css';

function CircuitSelector({ children }) {
  const [circuits, setCircuits] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // アバカスサーキットの開催回の一覧を取得
    const fetchCircuits = async () => {
      try {
        const { data, error } = await supabase
          .from('abacus_circuit_events')
          .select('*')
          .order('circuit_round', { ascending: false })
          .limit(24); // 直近2年分

        if (error) throw error;

        setCircuits(data || []);
      } catch (error) {
        console.error('サーキットデータ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCircuits();

    // 子どもが1人だけの場合は自動選択
    if (children && children.length === 1) {
      setSelectedChild(children[0]);
    }
  }, [children]);

  // 子どもを選択する処理
  const handleChildSelect = (child) => {
    setSelectedChild(child);
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  // 子どもの選択が必要な場合
  if (!selectedChild && children.length > 1) {
    return (
      <div className="selector-container">
        <h2>お子様を選択してください</h2>
        <div className="child-list">
          {children.map((child) => (
            <div
              key={child.id}
              className="child-item"
              onClick={() => handleChildSelect(child)}
            >
              {child.family_name} {child.given_name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="selector-container">
      {selectedChild && (
        <div className="child-info">
          <h2>{selectedChild.family_name} {selectedChild.given_name}さんの成績</h2>
          <button onClick={() => setSelectedChild(null)} className="change-button">
            お子様を変更
          </button>
        </div>
      )}

      <h3>アバカスサーキット一覧</h3>
      
      <div className="circuit-list">
        {circuits.map((circuit) => (
          <div key={circuit.id} className="circuit-card">
            <h4>第{circuit.circuit_round}回</h4>
            <p className="circuit-date">{formatDate(circuit.event_date)}</p>
            
            <div className="circuit-buttons">
              <Link
                to={`/student/${selectedChild?.seito_id}/${circuit.circuit_round}`}
                className="student-button"
              >
                個人成績
              </Link>
              
              <Link
                to={`/ranking/${circuit.circuit_round}/0`}
                className="ranking-button f0"
              >
                F0順位表
              </Link>
              
              <Link
                to={`/ranking/${circuit.circuit_round}/1`}
                className="ranking-button f1"
              >
                F1順位表
              </Link>
              
              <Link
                to={`/ranking/${circuit.circuit_round}/2`}
                className="ranking-button f2"
              >
                F2順位表
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 日付をフォーマットする関数
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export default CircuitSelector;
