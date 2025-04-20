import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@services/supabase';
import './CircuitRanking.css';

function CircuitRanking() {
  const { round, classLevel } = useParams();
  const [rankings, setRankings] = useState([]);
  const [eventInfo, setEventInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. イベント情報の取得
        const { data: eventData, error: eventError } = await supabase
          .from('abacus_circuit_events')
          .select('*')
          .eq('circuit_round', round)
          .single();

        if (eventError) throw eventError;

        // 2. 順位データの取得（順位は計算する）
        const { data: resultsData, error: resultsError } = await supabase
          .from('abacus_circuit_results')
          .select(`
            *,
            students (
              family_name,
              given_name,
              school_name
            )
          `)
          .eq('circuit_round', round)
          .eq('class_level', classLevel)
          .order('total_score', { ascending: false });

        if (resultsError) throw resultsError;

        // 3. 順位を計算して追加
        const rankedResults = calculateRankings(resultsData);

        setEventInfo(eventData);
        setRankings(rankedResults);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [round, classLevel]);

  // 順位を計算する関数
  const calculateRankings = (results) => {
    if (!results || results.length === 0) return [];
    
    let currentRank = 1;
    let currentScore = -1;
    let count = 0;
    
    return results.map((item, index) => {
      if (item.total_score !== currentScore) {
        currentRank = index + 1;
        currentScore = item.total_score;
      }
      count++;
      
      return {
        ...item,
        calculated_rank: currentRank
      };
    });
  };

  // クラスレベルを表示用に変換
  const formatClassLevel = (level) => {
    switch (level) {
      case '0': return 'F0';
      case '1': return 'F1';
      case '2': return 'F2';
      default: return '不明';
    }
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="ranking-container">
      <div className="event-header">
        <h2>第{round}回 アバカスサーキット</h2>
        <div className="event-date">{eventInfo && formatDate(eventInfo.event_date)}</div>
      </div>

      <div className="class-tabs">
        <Link 
          to={`/ranking/${round}/0`} 
          className={classLevel === '0' ? 'active' : ''}
        >
          F0クラス
        </Link>
        <Link 
          to={`/ranking/${round}/1`} 
          className={classLevel === '1' ? 'active' : ''}
        >
          F1クラス
        </Link>
        <Link 
          to={`/ranking/${round}/2`} 
          className={classLevel === '2' ? 'active' : ''}
        >
          F2クラス
        </Link>
      </div>

      <div className="ranking-title">
        <h3>{formatClassLevel(classLevel)}クラス 順位表</h3>
      </div>

      <div className="ranking-table">
        <table>
          <thead>
            <tr>
              <th className="rank-header">順位</th>
              <th className="name-header">お名前</th>
              <th className="score-header">かけ算</th>
              <th className="score-header">わり算</th>
              <th className="score-header">見取算</th>
              <th className="total-header">合計</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((item, index) => (
              <tr key={item.id} className={getRankClass(index)}>
                <td className="rank-cell">
                  {index < 3 && (
                    <div className="medal-icon">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                  {item.calculated_rank}
                </td>
                <td className="name-cell">{item.students?.family_name} {item.students?.given_name}</td>
                <td className="score-cell">{item.multiplication_score}</td>
                <td className="score-cell">{item.division_score}</td>
                <td className="score-cell">{item.mental_calculation_score}</td>
                <td className="total-cell">{item.total_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <Link to="/" className="back-button">ホームに戻る</Link>
      </div>
    </div>
  );
}

// 順位に応じたクラス名を取得
function getRankClass(index) {
  if (index === 0) return 'rank-first';
  if (index === 1) return 'rank-second';
  if (index === 2) return 'rank-third';
  return '';
}

// 日付をフォーマットする関数
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export default CircuitRanking;