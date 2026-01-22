import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import styles from "../ticket-management/CoordinatorAdminTicketManagement.module.css";
import Table from "../../../shared/table/Table";
import getTicketActions from "../../../shared/table/TicketActions";
import CoordinatorMyTicketsFilter from "../../components/filters/CoordinatorMyTicketsFilter";
import { COORDINATOR_MOCK_TICKETS } from "../../mocks/coordinatorTicketsMock";
import "react-toastify/dist/ReactToastify.css";

// Helper function to calculate SLA status
const calculateSLAStatus = (ticket) => {
	if (!ticket.dateCreated) return "Unknown";

	const createdDate = new Date(ticket.dateCreated);
	const now = new Date();
	const hoursDiff = (now - createdDate) / (1000 * 60 * 60);

	// SLA rules based on priority
	const slaHours = {
		Critical: 4,
		High: 8,
		Medium: 24,
		Low: 48,
	};

	const slaLimit = slaHours[ticket.priorityLevel] || 24;

	if (hoursDiff > slaLimit) return "Overdue";
	if (hoursDiff > slaLimit * 0.8) return "Due Soon";
	return "On Time";
};

const MOCK_TICKETS = COORDINATOR_MOCK_TICKETS;

const CoordinatorMyTickets = () => {
	const navigate = useNavigate();

	const [allTickets, setAllTickets] = useState(MOCK_TICKETS);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
 	const [isLoading, setIsLoading] = useState(true);
	const [activeFilters, setActiveFilters] = useState({});
	const [showFilter, setShowFilter] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsLoading(false), 300);
		return () => clearTimeout(timer);
	}, []);

	const filteredTickets = useMemo(() => {
		let result = allTickets;

		// Search
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase();
			result = result.filter(
				(ticket) =>
					ticket.ticketNumber?.toLowerCase().includes(term) ||
					ticket.subject?.toLowerCase().includes(term)
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
				if (statusSel && statusSel.length > 0 && !statusSel.includes(ticket.status)) {
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

	const handleFilterApply = (filters) => {
		setActiveFilters(filters || {});
		setCurrentPage(1);
	};

	const handleFilterReset = () => {
		setActiveFilters({});
		setCurrentPage(1);
	};

	const FilterComponent = () => (
		<CoordinatorMyTicketsFilter
			key={showFilter ? "filter-shown" : "filter-hidden"}
			preset="ticketManagement"
			initialShow={showFilter}
			hideToggleButton={true}
			onApply={handleFilterApply}
			onReset={handleFilterReset}
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
								render: (value) => (
									<div className={styles.subjectCell || ""} title={value}>
										{value || "-"}
									</div>
								),
							},
							{
								key: "status",
								label: "Status",
								skeletonWidth: "80px",
								render: (value, ticket) => {
									const status = value || ticket.status || "";
									const className = status.replace(/\s+/g, "-").toLowerCase();
									return <span className={`status-${className}`}>{status}</span>;
								},
							},
							{ 
								key: 'category', 
								label: 'Category', 
								skeletonWidth: '100px',
								render: (value) => value || "-"
							},
							{ 
								key: 'subCategory', 
								label: 'Sub Category', 
								skeletonWidth: '100px',
								render: (value) => value || "-"
							},
							{
								key: "priorityLevel",
								label: "Priority",
								skeletonWidth: "80px",
								render: (value) => {
									if (!value) return <span className="priority-not-set">Not Set</span>;
									return <span className={`priority-${value.toLowerCase()}`}>{value}</span>;
								},
							},
							{ 
								key: "workflow", 
								label: "Workflow", 
								skeletonWidth: "120px", 
								render: (value) => value || "-" 
							},
							{ 
								key: "currentStep", 
								label: "Current Step", 
								skeletonWidth: "120px", 
								render: (value) => value || "-" 
							},
							{
								key: "slaStatus",
								label: "SLA Status",
								skeletonWidth: "100px",
								render: (value, ticket) => {
									const sla = calculateSLAStatus(ticket);
									const className = sla.replace(/\s+/g, "-").toLowerCase();
									return <span className={`sla-${className}`}>{sla}</span>;
								},
							},
							{ 
								key: "dateCreated", 
								label: "Date Created", 
								skeletonWidth: "140px", 
								render: (value, ticket) => {
									const date = value || ticket.dateCreated;
									return date ? new Date(date).toLocaleString() : "-";
								}
							},
							{
								key: "actions",
								label: "Actions",
								skeletonWidth: "80px",
								render: (value, ticket) => (
									<>
										{getTicketActions("view", ticket, { 
											onView: () => navigate(`/admin/owned-tickets/${ticket.ticketNumber}`) 
										})}
									</>
								),
							},
						]}
						filterComponent={FilterComponent}
						showFilter={showFilter}
						onShowFilterChange={setShowFilter}
						title={"My Tickets"}
						searchable
						searchPlaceholder={"Search..."}
						searchValue={searchTerm}
						onSearchChange={(e) => setSearchTerm(e.target.value)}
						currentPage={currentPage}
						pageSize={itemsPerPage}
						totalItems={filteredTickets.length}
						onPageChange={setCurrentPage}
						onPageSizeChange={setItemsPerPage}
						isLoading={isLoading}
				emptyMessage={"No tickets found for this search."}
			/>
		</>
	);

}

export default CoordinatorMyTickets;