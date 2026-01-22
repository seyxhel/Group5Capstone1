import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Table from "../../../../shared/table/Table";
import { getAllTickets } from "../../../../utilities/storages/ticketStorage";
import authService from "../../../../utilities/service/authService";
import getTicketActions from "../../../../shared/table/TicketActions";

import CoordinatorAdminOpenTicketModal from "../../../components/modals/ticket-management/CoordinatorOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../../components/modals/ticket-management/CoordinatorRejectTicketModal";
import CoordinatorTicketFilter from "../../../components/filters/CoordinatorAdminTicketManagementFilter";
import "react-toastify/dist/ReactToastify.css";

// Helper function to calculate SLA status
const calculateSLAStatus = (ticket) => {
	if (!ticket.dateCreated) return "Unknown";
  
	const createdDate = new Date(ticket.dateCreated);
	const now = new Date();
	const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
  
	const slaHours = {
		'Critical': 4,
		'High': 8,
		'Medium': 24,
		'Low': 48
	};
  
	const slaLimit = slaHours[ticket.priorityLevel] || 24;
  
	if (hoursDiff > slaLimit) return "Overdue";
	if (hoursDiff > slaLimit * 0.8) return "Due Soon";
	return "On Time";
};

const computeEffectiveStatus = (ticket) => {
	const rawStatus = (ticket.status || '').toString();
	const lower = rawStatus.toLowerCase();
	const baseIsNew = lower === 'new' || lower === 'submitted' || lower === 'pending';
	try {
		const created = new Date(ticket.createdAt || ticket.dateCreated || ticket.created_at || ticket.submit_date || ticket.submitDate);
		if (baseIsNew && created instanceof Date && !isNaN(created)) {
			const hours = (new Date() - created) / (1000 * 60 * 60);
			if (hours >= 24) return 'Pending';
			return 'New';
		}
	} catch (e) {
		// ignore parse errors
	}
	return rawStatus || '';
};

const CoordinatorBMSTickets = () => {
	const navigate = useNavigate();

	const [currentUser, setCurrentUser] = useState(null);
	const [allTickets, setAllTickets] = useState([]);
	const [showFilter, setShowFilter] = useState(false);
	const [activeFilters, setActiveFilters] = useState({
		status: null,
		priority: null,
		category: null,
		subCategory: null,
		slaStatus: null,
		startDate: "",
		endDate: "",
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedTicket, setSelectedTicket] = useState(null);
	const [modalType, setModalType] = useState(null);
	const [statusFilter, setStatusFilter] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			const user = authService.getCurrentUser();
			setCurrentUser(user);

			const fetched = getAllTickets();

			// Prepare sets
			const budgetProposals = fetched.filter(ticket => (ticket.category || '') === 'New Budget Proposal');

			// Default: show all BMS-related tickets for non-coordinators (or show all if no clear BMS category exists)
			// For Ticket Coordinators: show only New Budget Proposal tickets relevant to their department or assignment
			let ticketsToShow = fetched;
			if (user && user.role === 'Ticket Coordinator') {
				ticketsToShow = budgetProposals.filter(ticket => {
					const ticketDept = ticket.department || ticket.assignedDepartment || ticket.assigned_to_department || null;
					const assignedToId = typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.id : ticket.assignedTo;
					const isAssignedToUser = assignedToId === user.id || ticket.assignedToId === user.id || ticket.assigned_to === user.id;
					return ticketDept === user.department || isAssignedToUser;
				});
			}

			setAllTickets(ticketsToShow);
			setIsLoading(false);
		}, 300);

		return () => clearTimeout(timer);
	}, []);

	const filteredTickets = useMemo(() => {
		const decorated = allTickets.map(t => ({ ...t, __effectiveStatus: computeEffectiveStatus(t) }));

		let result = decorated;

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				({ ticketNumber, subject }) =>
					ticketNumber?.toLowerCase().includes(term) ||
					subject?.toLowerCase().includes(term)
			);
		}

		// Apply filter panel selections (if any)
		if (activeFilters && Object.keys(activeFilters).length > 0) {
			const normalize = (f) => {
				if (f == null || f === undefined) return null;
				if (Array.isArray(f)) return f.map((x) => (typeof x === "string" ? x : x.label || x.value || "")).filter(Boolean);
				if (typeof f === "object") return [f.label || f.value || ""];
				return [String(f)];
			};

			const statusSel = normalize(activeFilters.status);
			const prioritySel = normalize(activeFilters.priority);
			const categorySel = normalize(activeFilters.category);
			const subCategorySel = normalize(activeFilters.subCategory);
			const slaSel = normalize(activeFilters.slaStatus);

			const startDate = activeFilters.startDate ? new Date(activeFilters.startDate) : null;
			const endDate = activeFilters.endDate ? new Date(activeFilters.endDate) : null;

			result = result.filter((ticket) => {
				// Check status filter
				if (statusSel && statusSel.length > 0 && !statusSel.includes(ticket.__effectiveStatus)) {
					return false;
				}

				// Check priority filter
				if (prioritySel && prioritySel.length > 0 && !prioritySel.includes(ticket.priorityLevel)) {
					return false;
				}

				// Check category filter
				if (categorySel && categorySel.length > 0 && !categorySel.includes(ticket.category)) {
					return false;
				}

				// Check subCategory filter
				if (subCategorySel && subCategorySel.length > 0 && !subCategorySel.includes(ticket.subCategory)) {
					return false;
				}

				// Check SLA filter
				if (slaSel && slaSel.length > 0) {
					const sla = calculateSLAStatus(ticket);
					if (!slaSel.includes(sla)) return false;
				}

				// Check date range filter
				if ((startDate || endDate) && ticket.dateCreated) {
					const created = new Date(ticket.dateCreated);
					if (startDate && created < startDate) return false;
					if (endDate) {
						const endOfDay = new Date(endDate);
						endOfDay.setHours(23, 59, 59, 999);
						if (created > endOfDay) return false;
					}
				}

				return true;
			});
		}

		return result;
	}, [allTickets, searchTerm, activeFilters]);

	const paginatedTickets = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage;
		return filteredTickets.slice(start, start + itemsPerPage);
	}, [filteredTickets, currentPage, itemsPerPage]);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, activeFilters]);

	const openModal = (type, ticket) => {
		setSelectedTicket(ticket);
		setModalType(type);
	};

	const closeModal = () => {
		setSelectedTicket(null);
		setModalType(null);
	};

	const handleSuccess = (ticketNumber, newStatus) => {
		setAllTickets((prev) =>
			prev.map((ticket) =>
				ticket.ticketNumber === ticketNumber
					? { ...ticket, status: newStatus }
					: ticket
			)
		);
		closeModal();
	};

	const isActionable = (status) => {
		const s = (status || "").toLowerCase();
		if (!currentUser) return false;
		if (currentUser.role !== 'Ticket Coordinator') return false;
		return s === "new" || s === "submitted" || s === "pending";
	};

	const FilterComponent = () => (
		<CoordinatorTicketFilter
			key={showFilter ? "filter-shown" : "filter-hidden"}
			preset="ticketManagement"
			initialShow={showFilter}
			hideToggleButton={true}
			onApply={setActiveFilters}
			onReset={() => {
				setActiveFilters({
					status: null,
					priority: null,
					category: null,
					subCategory: null,
					slaStatus: null,
					startDate: "",
					endDate: "",
				});
				setCurrentPage(1);
			}}
			initialFilters={activeFilters}
		/>
	);

	return (
		<>
			<ToastContainer />
			<Table
				variant="ticketManagement"
				data={paginatedTickets}
				columns={[
					{ 
						key: "ticketNumber", 
						label: "Ticket No.", 
						skeletonWidth: "100px", 
						render: (value) => value || "-" 
					},
					{
						key: "subject",
						label: "Subject",
						skeletonWidth: "200px",
						render: (value) => value || "-",
					},
					{ 
						key: "__effectiveStatus", 
						label: "Status",
						skeletonWidth: "80px",
						render: (value, ticket) => {
							const status = value || ticket.status;
							const statusKey = status.replace(/\s+/g, "-").toLowerCase();
							return <span className={`status-${statusKey}`}>{status}</span>;
						}
					},
					{ key: "category", label: "Category", skeletonWidth: "100px", render: (value) => value || "-" },
					{ key: "subCategory", label: "Sub Category", skeletonWidth: "100px", render: (value) => value || "-" },
					{ 
						key: "priorityLevel", 
						label: "Priority",
						skeletonWidth: "80px",
						render: (value) => {
							if (!value) return <span className="priority-not-set">Not Set</span>;
							return <span className={`priority-${value.toLowerCase()}`}>{value}</span>;
						}
					},
					{ 
						key: "slaStatus", 
						label: "SLA Status",
						skeletonWidth: "100px",
						render: (_, ticket) => {
							const slaStatus = calculateSLAStatus(ticket);
							const slaKey = slaStatus.replace(/\s+/g, "-").toLowerCase();
							return <span className={`sla-${slaKey}`}>{slaStatus}</span>;
						}
					},
					{ 
						key: "assignedAgent", 
						label: "Assigned Agent",
						skeletonWidth: "120px",
						render: (value) => value || "Unassigned"
					},
					{
						key: "actions",
						label: "Actions",
						skeletonWidth: "80px",
						render: (_, ticket) => (
							<>
								{getTicketActions("view", ticket, { 
									onView: () => navigate(`/admin/ticket-tracker/${ticket.ticketNumber}`) 
								})}
								{isActionable(ticket.__effectiveStatus || ticket.status) && 
									getTicketActions("edit", ticket, { 
										onEdit: () => openModal("open", ticket) 
									})}
								{isActionable(ticket.__effectiveStatus || ticket.status) && 
									getTicketActions("delete", ticket, { 
										onDelete: () => openModal("reject", ticket) 
									})}
							</>
						)
					},
				]}
				filterComponent={FilterComponent}
				showFilter={showFilter}
				onShowFilterChange={setShowFilter}
				title="BMS Tickets"
				searchable
				searchPlaceholder="Search..."
				searchValue={searchTerm}
				onSearchChange={(e) => setSearchTerm(e.target.value)}
				currentPage={currentPage}
				pageSize={itemsPerPage}
				totalItems={filteredTickets.length}
				onPageChange={setCurrentPage}
				onPageSizeChange={setItemsPerPage}
				isLoading={isLoading}
				emptyMessage="No BMS tickets found for this status or search."
			/>

			{modalType === "open" && selectedTicket && (
				<CoordinatorAdminOpenTicketModal
					ticket={selectedTicket}
					onClose={closeModal}
					onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Open")}
				/>
			)}

			{modalType === "reject" && selectedTicket && (
				<CoordinatorAdminRejectTicketModal
					ticket={selectedTicket}
					onClose={closeModal}
					onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Rejected")}
				/>
			)}
		</>
	);
};

export default CoordinatorBMSTickets;

