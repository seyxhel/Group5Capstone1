import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';

import styles from './CoordinatorAdminCSAT.module.css';
import CSAT_MOCK from '../../../mock-data/csatData';
import Table from '../../../shared/table/Table';
import FilterPanel from '../../../shared/table/FilterPanel';
import Tabs from '../../../shared/components/Tabs';
import authService from '../../../utilities/service/authService';
import { getTicketById } from '../../../utilities/storages/ticketStorage';
import CoordinatorAdminCSATViewModal from '../../components/modals/csat/CoordinatorAdminCSATViewModal';

// Using mock data only — no API base URL

const categoryLabels = {
  all: 'All Ratings',
  excellent: 'Excellent Ratings',
  good: 'Good Ratings',
  neutral: 'Neutral Ratings',
  poor: 'Poor Ratings',
  'very-poor': 'Very Poor Ratings',
};

const ratingMap = {
  excellent: 5,
  good: 4,
  neutral: 3,
  poor: 2,
  'very-poor': 1,
};

const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const getRatingColor = (rating) => {
  switch (rating) {
    case 5:
      return 'var(--csat-excellent)';
    case 4:
      return 'var(--csat-good)';
    case 3:
      return 'var(--csat-neutral)';
    case 2:
      return 'var(--csat-poor)';
    case 1:
      return 'var(--csat-very-poor)';
    default:
      return 'var(--csat-default)';
  }
};

const getRatingText = (rating) => {
  switch (rating) {
    case 5:
      return 'Excellent';
    case 4:
      return 'Good';
    case 3:
      return 'Neutral';
    case 2:
      return 'Poor';
    case 1:
      return 'Very Poor';
    default:
      return 'N/A';
  }
};

const SysAdminCSAT = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [activeFilters, setActiveFilters] = useState({
    rating: null,
    startDate: '',
    endDate: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCSAT, setSelectedCSAT] = useState(null);

  // Small Avatar component with initials fallback when image fails
  const Avatar = ({ src, name, size = 40 }) => {
    const [failed, setFailed] = useState(false);
    const initials = (name || '')
      .split(' ')
      .filter(Boolean)
      .map(n => n[0].toUpperCase())
      .slice(0,2)
      .join('');

    if (!src || failed) {
      return (
        <div className={styles.avatarInitials} style={{ width: size, height: size, lineHeight: `${size}px`, fontSize: Math.floor(size/2.2) }}>
          {initials || 'U'}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={name}
        className={styles.profileImage}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  };

  // Extract category from URL path
  const parts = location.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const key = last === 'csat' || last === 'admin' ? 'all' : (categoryLabels[last] ? last : 'all');
  const title = categoryLabels[key] || 'All Ratings';

  const tabs = [
    { key: 'all', label: 'All Ratings' },
    { key: 'excellent', label: 'Excellent' },
    { key: 'good', label: 'Good' },
    { key: 'neutral', label: 'Neutral' },
    { key: 'poor', label: 'Poor' },
    { key: 'very-poor', label: 'Very Poor' },
  ];

  const FilterComponent = () => (
    <FilterPanel
      key={showFilter ? "filter-shown" : "filter-hidden"}
      fields={['rating', 'startDate', 'endDate']}
      filters={activeFilters}
      onApply={(filters) => {
        setActiveFilters(filters);
        setCurrentPage(1);
      }}
      onReset={() => {
        setActiveFilters({ rating: null, startDate: '', endDate: '' });
        setCurrentPage(1);
      }}
      hideToggleButton={true}
    />
  );

  const filtered = useMemo(() => {
    let rows = CSAT_MOCK.slice();

    // Role-based visibility: Ticket Coordinators only see CSATs for tickets they reviewed/approved
    const currentUser = authService.getCurrentUser?.();
    if (currentUser && currentUser.role === 'Ticket Coordinator') {
      rows = rows.filter((r) => {
        const ticket = getTicketById(r.ticketId) || getTicketById(Number(r.ticketId));
        if (!ticket) return false;
        // reviewer's id is stored as `reviewedById` on tickets
        return Number(ticket.reviewedById) === Number(currentUser.id);
      });
    }

    // Tab-based rating filter
    if (activeTab !== 'all') {
      const rating = ratingMap[activeTab];
      rows = rows.filter((r) => r.rating === rating);
    }

    // show only CSATs for tickets that are resolved (if ticketStatus present)
    rows = rows.filter(r => {
      if (r.ticketStatus) return String(r.ticketStatus).toLowerCase() === 'resolved';
      return true; // keep if no status available
    });

    // Apply search filter
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      rows = rows.filter((r) => (
        (r.ticketNumber || '').toLowerCase().includes(s) ||
        (r.subject || '').toLowerCase().includes(s) ||
        (r.employeeName || '').toLowerCase().includes(s)
      ));
    }

    // apply inline filter selections (rating + date range)
    if (activeFilters.rating) {
      rows = rows.filter(r => Number(r.rating) === Number(activeFilters.rating));
    }
    if (activeFilters.startDate) {
      rows = rows.filter(r => new Date(r.date) >= new Date(activeFilters.startDate));
    }
    if (activeFilters.endDate) {
      rows = rows.filter(r => new Date(r.date) <= new Date(activeFilters.endDate));
    }

    return rows;
  }, [activeTab, searchTerm, activeFilters]);

  const columns = [
    {
      key: 'profilePic',
      label: '',
      render: (val, row) => (
        <Avatar
          src={val || ''}
          name={row.employeeName}
          size={40}
        />
      ),
      skeletonWidth: '40px',
    },
    {
      key: 'employeeName',
      label: 'Employee',
      skeletonWidth: '120px',
    },
    {
      key: 'ticketNumber',
      label: 'Ticket No.',
      skeletonWidth: '100px',
    },
    {
      key: 'subject',
      label: 'Subject',
      skeletonWidth: '150px',
      render: (val) => (
        <div title={val} style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {val}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      skeletonWidth: '80px',
      render: (val) => (
        <span
          style={{
            backgroundColor: getRatingColor(val),
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 600,
          }}
          title={getRatingText(val)}
        >
          {val} ★
        </span>
      ),
    },
    {
      key: 'comment',
      label: 'Feedback',
      skeletonWidth: '150px',
      render: (val) => (
        <div title={val} style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {val}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date Rated',
      skeletonWidth: '130px',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      label: 'Actions',
      skeletonWidth: '80px',
      render: (val, row) => (
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
          onClick={() => setSelectedCSAT(row)}
          title="View details"
          aria-label={`View CSAT ${row.ticketNumber}`}
        >
          <FaEye />
        </button>
      ),
    },
  ];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, activeFilters]);

  return (
    <>
      <div style={{ marginTop: 12, marginBottom: 8 }}>
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>
      <Table
        variant="default"
        data={filtered
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
        columns={columns}
        title="CSAT Ratings"
        searchable
        searchValue={searchTerm}
        onSearchChange={(q) => {
          setSearchTerm(q);
          setCurrentPage(1);
        }}
        filterComponent={FilterComponent}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        currentPage={currentPage}
        pageSize={itemsPerPage}
        totalItems={filtered.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={(n) => {
          setItemsPerPage(n);
          setCurrentPage(1);
        }}
        isLoading={isLoading}
        emptyMessage="No CSAT entries found."
      />

      {selectedCSAT && (
        <CoordinatorAdminCSATViewModal
          csat={selectedCSAT}
          onClose={() => setSelectedCSAT(null)}
        />
      )}
    </>
  );
};

export default SysAdminCSAT;
