import React, { useState, useEffect } from 'react';

interface LeadItem {
  ID: string;
  구분: string;
  "단지/커뮤니티명": string;
  타겟대상: string;
  주요타겟제품: string;
  커뮤니티_URL: string;
  규모_세대수: string;
  우선순위: string;
  접촉상태: string;
  입주_공급시기: string;
}

export default function MarketingLeads() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetch('/data/leads_master_targets_2026.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setLeads(data.data);
      })
      .catch((err) => console.error('데이터 로드 실패:', err));
  }, []);

  const updateStatus = (id: string, newStatus: string) => {
    setLeads((prev) =>
      prev.map((item) => (item.ID === id ? { ...item, 접촉상태: newStatus } : item))
    );
  };

  const filteredLeads = leads.filter((item) => {
    const matchCategory = filterCategory === 'ALL' || item.구분.includes(filterCategory);
    const matchSearch =
      (item["단지/커뮤니티명"] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.타겟대상 || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>올렌탈 실전 영업 타겟 관리 (총 {filteredLeads.length}건)</h2>
        <div>
          <input
            type='text'
            placeholder='단지명, 지역 검색...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 14px', marginRight: '10px', borderRadius: '4px', border: '1px solid #ccc', width: '260px' }}
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value='ALL'>전체 보기</option>
            <option value='2026신축입주'>2026 신축아파트</option>
            <option value='웨딩'>웨딩/신혼</option>
            <option value='신축입주'>기존 입예협</option>
            <option value='1인가구'>1인가구/원룸</option>
            <option value='자영업'>소상공인/매장</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px 16px' }}>ID</th>
              <th style={{ padding: '12px 16px' }}>구분</th>
              <th style={{ padding: '12px 16px' }}>단지/커뮤니티명</th>
              <th style={{ padding: '12px 16px' }}>입주/공급시기</th>
              <th style={{ padding: '12px 16px' }}>규모</th>
              <th style={{ padding: '12px 16px' }}>추천 렌탈 제품</th>
              <th style={{ padding: '12px 16px' }}>접촉 상태</th>
              <th style={{ padding: '12px 16px' }}>바로가기</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((row) => (
              <tr key={row.ID} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{row.ID}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: row.구분.includes('신축') ? '#e3f2fd' : '#f3e5f5',
                    color: row.구분.includes('신축') ? '#1976d2' : '#7b1fa2'
                  }}>
                    {row.구분}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>{row["단지/커뮤니티명"]}</td>
                <td style={{ padding: '12px 16px' }}>{row.입주_공급시기}</td>
                <td style={{ padding: '12px 16px' }}>{row.규모_세대수}</td>
                <td style={{ padding: '12px 16px' }}>{row.주요타겟제품}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={row.접촉상태}
                    onChange={(e) => updateStatus(row.ID, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      backgroundColor: row.접촉상태 === '완료' ? '#e8f5e9' : row.접촉상태 === '진행중' ? '#fff9c4' : '#fff'
                    }}
                  >
                    <option value='미접촉'>미접촉</option>
                    <option value='진행중'>진행중</option>
                    <option value='완료'>접촉완료</option>
                  </select>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <a
                    href={row.커뮤니티_URL}
                    target='_blank'
                    rel='noreferrer'
                    style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    링크 열기 ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
