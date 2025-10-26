import React, { useState, useEffect } from 'react';
import baseStyles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import styles from './CoordinatorAdminTicketDetails.module.css';
import { getEmployeeUserById, getEmployeeUsers } from '../../../utilities/storages/employeeUserStorage';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { convertToSecureUrl } from '../../../utilities/secureMedia';

const DEFAULT_AVATAR = '/MapLogo.png';

function PersonCard({ name, metaLines = [], image }) {
  return (
    <div className={styles.personCard}>
      <div className={styles.avatarWrap}>
        <img src={image || DEFAULT_AVATAR} alt={name || 'Profile'} className={styles.avatarImage} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
      </div>
      <div className={styles.personInfo}>
        <div className={styles.personName}>{name || '—'}</div>
        {metaLines.map((m, i) => (
          <div className={styles.personMeta} key={i}>{m}</div>
        ))}
      </div>
    </div>
  );
}

export default function CoordinatorAdminTicketDetails({ ticket, ticketLogs = [], canSeeCoordinatorReview, formatDate }) {
  // Resolve employee in a robust way. ticket.employee may be:
  // - an ID (number)
  // - an object { id, first_name, last_name, ... }
  // - absent, with alternate fields like employeeId, employeeName, employee_first_name, etc.
  let resolvedEmpId = null;
  let empSourceObj = null;

  if (ticket?.employee !== undefined && ticket?.employee !== null) {
    if (typeof ticket.employee === 'number') {
      resolvedEmpId = ticket.employee;
    } else if (typeof ticket.employee === 'object') {
      empSourceObj = ticket.employee;
      resolvedEmpId = ticket.employee.id || ticket.employee.pk || ticket.employee.employee_id || null;
    }
  }

  // fallback id fields
  resolvedEmpId = resolvedEmpId || ticket?.employeeId || ticket?.employee_id || ticket?.employeeNumber || ticket?.employee_number || null;

  // If we don't have a source object but there are fields on ticket, build a small source object
  if (!empSourceObj) {
    empSourceObj = ticket?.employee || ticket?.customer || null;
    // if still not an object, synthesize from other ticket fields
    if (!empSourceObj || typeof empSourceObj !== 'object') {
      empSourceObj = {
        id: resolvedEmpId || null,
        first_name: ticket?.employee_first_name || ticket?.employeeFirstName || null,
        middle_name: ticket?.employee_middle_name || ticket?.employeeMiddleName || null,
        last_name: ticket?.employee_last_name || ticket?.employeeLastName || null,
        company_id: ticket?.company_id || ticket?.employee_company_id || ticket?.employeeCompanyId || null,
        department: ticket?.employeeDepartment || ticket?.employee_department || ticket?.department || null,
        image: ticket?.employeeProfileImage || ticket?.employeeProfileImageUrl || ticket?.employee_profile_image || null,
      };
    }
  }

  let employeeUser = resolvedEmpId ? getEmployeeUserById(Number(resolvedEmpId)) : null;

  // If we didn't find by numeric id, try to find by companyId/company_id string (e.g. MA0111 / EMP-002)
  if (!employeeUser) {
    const companyIdCandidate = ticket?.company_id || ticket?.employee_company_id || ticket?.employeeCompanyId || null;
    const resolvedCompanyId = companyIdCandidate || empSourceObj?.company_id || empSourceObj?.companyId || null;
    if (resolvedCompanyId) {
      const fromStore = getEmployeeUsers().find(u => u.companyId === resolvedCompanyId || u.company_id === resolvedCompanyId || String(u.id) === String(resolvedCompanyId));
      if (fromStore) employeeUser = fromStore;
    }
  }

  // remoteEmployee will hold backend-fetched employee when local fixture not found
  const [remoteEmployee, setRemoteEmployee] = useState(null);

  // prefer stored fixture profileImage (camelCase key `profileImage`) and fall back to other fields
  let employeeImage = employeeUser?.profileImage || empSourceObj?.image || ticket?.employeeProfileImage || ticket?.employee_profile_image || DEFAULT_AVATAR;

  // If remoteEmployee image exists and is a media path, convert to secure URL
  if (remoteEmployee?.image) {
    const secure = convertToSecureUrl(remoteEmployee.image) || remoteEmployee.image;
    employeeImage = secure;
  }

  // If we don't have a local stored user, try fetching from backend by listing employees first
  // (some deployments don't expose per-id endpoints; listing avoids 404s)
  useEffect(() => {
    let cancelled = false;
    async function tryFetch() {
      if (employeeUser || remoteEmployee) return;
      try {
        const list = await backendEmployeeService.getAllEmployees().catch(() => []);
        if (!cancelled && Array.isArray(list) && list.length) {
          // try match by numeric id first
          if (resolvedEmpId) {
            const byId = list.find(e => String(e.id) === String(resolvedEmpId) || String(e.pk) === String(resolvedEmpId));
            if (byId) {
              setRemoteEmployee(byId);
              return;
            }
          }

          const companyIdCandidate = ticket?.company_id || ticket?.employee_company_id || ticket?.employeeCompanyId || empSourceObj?.company_id || empSourceObj?.companyId || null;
          if (companyIdCandidate) {
            const found = list.find(e => e.company_id === companyIdCandidate || e.companyId === companyIdCandidate || String(e.id) === String(companyIdCandidate));
            if (found) {
              setRemoteEmployee(found);
              return;
            }
          }
        }

        // Avoid calling per-id endpoint when the listing returned results (to prevent 404s).
        // Only attempt per-id fetch if the listing returned no employees.
        if (!cancelled && (!list || !list.length) && resolvedEmpId) {
          const data = await backendEmployeeService.getEmployeeById(resolvedEmpId).catch(() => null);
          if (!cancelled && data) setRemoteEmployee(data);
        }
      } catch (e) {
        // ignore fetch errors
      }
    }
    tryFetch();
    return () => { cancelled = true; };
  }, [resolvedEmpId, ticket?.company_id, empSourceObj?.company_id, employeeUser, remoteEmployee]);

  // ---------- Coordinator resolution & remote fetch ----------
  // Resolve coordinator id similarly to employee
  const resolvedCoordId = ticket?.coordinatorReview?.coordinatorId || ticket?.coordinator?.id || ticket?.assignedTo || ticket?.assigned_to || ticket?.coordinatorId || ticket?.coordinator_id || null;
  let coordinatorUser = resolvedCoordId ? getEmployeeUserById(Number(resolvedCoordId)) : null;
  // try find by companyId if not found
  if (!coordinatorUser) {
  const coordCompanyId = ticket?.coordinatorReview?.coordinatorCompanyId || ticket?.coordinatorCompanyId || ticket?.coordinator_company_id || ticket?.assignedToCompanyId || ticket?.coordinator?.company_id || ticket?.approved_by || null;
  const resolvedCoordCompany = coordCompanyId || null;
    if (resolvedCoordCompany) {
      const fromStore = getEmployeeUsers().find(u => u.companyId === resolvedCoordCompany || u.company_id === resolvedCoordCompany || String(u.id) === String(resolvedCoordCompany));
      if (fromStore) coordinatorUser = fromStore;
    }
  }

  const [remoteCoordinator, setRemoteCoordinator] = useState(null);

  // coordinator image fallback: prefer stored fixture; else remoteCoordinator; else ticket fields
  let coordinatorImageSrc = coordinatorUser?.profileImage || remoteCoordinator?.image || ticket?.coordinator?.image || ticket?.coordinatorReview?.coordinatorProfileImage || ticket?.coordinatorProfileImageUrl || DEFAULT_AVATAR;
  if (remoteCoordinator?.image) {
    coordinatorImageSrc = convertToSecureUrl(remoteCoordinator.image) || remoteCoordinator.image;
  }

  // attempt to fetch coordinator from backend list if not found locally
  useEffect(() => {
    let cancelled = false;
    async function fetchCoordinator() {
      if (coordinatorUser || remoteCoordinator) return;
      try {
        const list = await backendEmployeeService.getAllEmployees().catch(() => []);
        if (!cancelled && Array.isArray(list) && list.length) {
          if (resolvedCoordId) {
            const found = list.find(e => String(e.id) === String(resolvedCoordId) || String(e.pk) === String(resolvedCoordId));
            if (found) { setRemoteCoordinator(found); return; }
          }
          const coordCompanyId = ticket?.coordinatorReview?.coordinatorCompanyId || ticket?.coordinatorCompanyId || ticket?.coordinator_company_id || null;
          if (coordCompanyId) {
            const found = list.find(e => e.company_id === coordCompanyId || e.companyId === coordCompanyId || String(e.id) === String(coordCompanyId));
            if (found) { setRemoteCoordinator(found); return; }
          }
        }
      } catch (e) {
        // ignore
      }
    }
    fetchCoordinator();
    return () => { cancelled = true; };
  }, [resolvedCoordId, ticket?.coordinatorReview, coordinatorUser, remoteCoordinator]);

  // derive department and company id using the stored user keys when available
  const employeeDepartment = empSourceObj?.department || employeeUser?.department || ticket?.employeeDepartment || ticket?.department || null;
  const employeeCompanyId = employeeUser?.companyId || empSourceObj?.company_id || empSourceObj?.companyId || ticket?.company_id || ticket?.employee_company_id || null;

  // Use resolved coordinatorUser / remoteCoordinator to produce coordinatorImage
  const coordinatorImage = coordinatorImageSrc;

  // If we don't have explicit coordinator identity from ticket fields, try to derive
  // from the most-recent ticket log's rawActor (generateLogs now provides rawActor)
  let fallbackLogActor = null;
  try {
    if (Array.isArray(ticketLogs) && ticketLogs.length) {
      // ticketLogs are newest-first; pick first log that has a rawActor and isn't a System entry
      const found = ticketLogs.find((l) => l.rawActor && String(l.user || '').toLowerCase() !== 'system');
      if (found) fallbackLogActor = found.rawActor;
    }
  } catch (e) {
    // ignore
  }

  // Prepare display values that prefer explicit coordinator fields but fall back to log actor
  let displayCoordinatorFullName = null;
  let displayCoordinatorImage = coordinatorImage;

  // existing computed coordinatorFullName may be present; prefer it
  try {
    if (typeof coordinatorFullName === 'string' && coordinatorFullName.trim()) displayCoordinatorFullName = coordinatorFullName;
  } catch (e) { /* ignore */ }

  if (!displayCoordinatorFullName && fallbackLogActor) {
    if (typeof fallbackLogActor === 'object') {
      const fFirst = fallbackLogActor.first_name || fallbackLogActor.firstName || fallbackLogActor.name || null;
      const fMiddle = fallbackLogActor.middle_name || fallbackLogActor.middleName || '';
      const fLast = fallbackLogActor.last_name || fallbackLogActor.lastName || '';
      displayCoordinatorFullName = [fFirst, fMiddle, fLast].filter(Boolean).join(' ');
      if ((!displayCoordinatorImage || displayCoordinatorImage === DEFAULT_AVATAR) && (fallbackLogActor.image || fallbackLogActor.profileImage)) {
        displayCoordinatorImage = convertToSecureUrl(fallbackLogActor.image || fallbackLogActor.profileImage) || fallbackLogActor.image || fallbackLogActor.profileImage;
      }
    } else if (typeof fallbackLogActor === 'string') {
      displayCoordinatorFullName = fallbackLogActor;
    }
  }

  // Build nice full names for display (first [middle] last)
  const empFirst = empSourceObj?.first_name || ticket?.employeeFirstName || ticket?.employee_first_name || employeeUser?.firstName || employeeUser?.first_name || remoteEmployee?.first_name || remoteEmployee?.firstName || (ticket?.employeeName ? ticket.employeeName.split(' ')[0] : null);
  const empMiddle = empSourceObj?.middle_name || ticket?.employeeMiddleName || ticket?.employee_middle_name || employeeUser?.middleName || employeeUser?.middle_name || remoteEmployee?.middle_name || remoteEmployee?.middleName || '';
  const empLast = empSourceObj?.last_name || ticket?.employeeLastName || ticket?.employee_last_name || employeeUser?.lastName || employeeUser?.last_name || remoteEmployee?.last_name || remoteEmployee?.lastName || (ticket?.employeeName ? ticket.employeeName.split(' ').slice(-1)[0] : '');
  const employeeFullName = [empFirst, empMiddle, empLast].filter(Boolean).join(' ');

  const coordFirst = ticket?.coordinatorReview?.coordinatorFirstName || ticket?.coordinator?.first_name || ticket?.coordinator?.firstName || coordinatorUser?.firstName || coordinatorUser?.first_name || remoteCoordinator?.first_name || remoteCoordinator?.firstName || ticket?.coordinatorName || (ticket?.assignedToName ? ticket.assignedToName.split(' ')[0] : '');
  const coordMiddle = ticket?.coordinatorReview?.coordinatorMiddleName || ticket?.coordinator?.middle_name || ticket?.coordinator?.middleName || coordinatorUser?.middleName || coordinatorUser?.middle_name || remoteCoordinator?.middle_name || remoteCoordinator?.middleName || '';
  const coordLast = ticket?.coordinatorReview?.coordinatorLastName || ticket?.coordinator?.last_name || ticket?.coordinator?.lastName || coordinatorUser?.lastName || coordinatorUser?.last_name || remoteCoordinator?.last_name || remoteCoordinator?.lastName || (ticket?.coordinatorName ? ticket.coordinatorName.split(' ').slice(-1)[0] : '');
  const coordinatorFullName = [coordFirst, coordMiddle, coordLast].filter(Boolean).join(' ');

  // Decide whether to show the coordinator block.
  // Show when there is any coordinator identity present (coordinatorReview, assignedTo, assigned_to, coordinatorId)
  // and the ticket is not in the 'new' status.
  const ticketStatus = (ticket?.status || '').toString().toLowerCase();
  const hasCoordinatorReview = Boolean(ticket?.coordinatorReview) || Boolean(resolvedCoordId) || Boolean(ticket?.assignedTo) || Boolean(ticket?.assigned_to) || Boolean(ticket?.coordinatorId) || Boolean(ticket?.coordinator_id) || Boolean(ticket?.coordinator) || Boolean(ticket?.approved_by) || Boolean(fallbackLogActor);
  const showCoordinator = hasCoordinatorReview && (ticketStatus !== 'new');

  // Temporary debug logs to help diagnose missing coordinator block in the wild.
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[Details Debug] ticketStatus:', ticketStatus, 'hasCoordinatorReview:', hasCoordinatorReview, 'showCoordinator:', showCoordinator);
      // eslint-disable-next-line no-console
      console.log('[Details Debug] resolvedEmpId:', resolvedEmpId, 'resolvedCoordId:', resolvedCoordId);
      // eslint-disable-next-line no-console
      console.log('[Details Debug] employeeUser:', employeeUser, 'remoteEmployee:', remoteEmployee);
      // eslint-disable-next-line no-console
      console.log('[Details Debug] coordinatorUser:', coordinatorUser, 'remoteCoordinator:', remoteCoordinator);
      // eslint-disable-next-line no-console
      console.log('[Details Debug] ticket.coordinatorReview:', ticket?.coordinatorReview, 'ticket.assignedTo:', ticket?.assignedTo, 'ticket.assigned_to:', ticket?.assigned_to);
    } catch (e) {
      // ignore
    }
  }, [ticket, ticketStatus, hasCoordinatorReview, showCoordinator, resolvedEmpId, resolvedCoordId, employeeUser, remoteEmployee, coordinatorUser, remoteCoordinator]);

  return (
    <div className={baseStyles.detailsGrid + ' ' + styles.detailsPanel + ' ' + styles.panelRoot}>
      <div className={styles.panelContent}>
      {/* Horizontal timeline bar above the sections */}
      <div className={styles.horizontalTimelineWrap}>
        <div className={styles.horizontalLine} />
        <div className={styles.horizontalDots}>
          {(() => {
            const steps = Math.max(5, ticketLogs?.length || 0);
            const activeIndex = Math.max(0, steps - 1);
            return Array.from({ length: steps }).map((_, i) => (
              <div key={i} className={`${styles.dot} ${i === activeIndex ? styles.activeDot : ''}`} />
            ));
          })()}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Employee</div>
        <div className={styles.userCardWrap}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{/* emoji fallback for now */}
              <img src={employeeImage} alt={employeeFullName || ticket?.employeeName || 'Employee'} className={styles.avatarImageInner} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{employeeFullName || ticket?.employeeName || '—'}</div>
              <div className={styles.userMeta}>
                {employeeDepartment || '—'}<br />
                Employee ID: {employeeCompanyId || (employeeUser?.id ? String(employeeUser.id) : '—')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCoordinator && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Ticket Coordinator</div>
          <div className={styles.userCardWrap}>
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                <img src={displayCoordinatorImage || DEFAULT_AVATAR} alt={displayCoordinatorFullName || 'Coordinator'} className={styles.avatarImageInner} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{displayCoordinatorFullName || (coordinatorUser ? `${coordinatorUser.firstName} ${coordinatorUser.lastName}` : '—')}</div>
                <div className={styles.userMeta}>
                  {coordinatorUser?.department || remoteCoordinator?.department || remoteCoordinator?.dept || ticket?.department || '—'}<br />
                  User ID: {coordinatorUser?.company_id || remoteCoordinator?.company_id || coordinatorUser?.id || remoteCoordinator?.id || ticket?.coordinatorReview?.coordinatorCompanyId || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Done removed — timeline displays activity and coordinator review appears under Coordinator section */}
      </div>
    </div>
  );
}
