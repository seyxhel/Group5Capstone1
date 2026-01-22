import React, { memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import NotificationContent from './NotificationContent';

const Notification = ({ title, className, ...props }) => {
	// A small ref marker where this component is mounted. We'll use its parent
	// position as the anchor for the portal so the dropdown can escape overflow.
	const mountRef = useRef(null);
	const [portalStyle, setPortalStyle] = useState(null);
	const portalNodeRef = useRef(null);

	useEffect(() => {
		// Create a container for the portal the first time we need it
		if (!portalNodeRef.current) {
			const node = document.createElement('div');
			document.body.appendChild(node);
			portalNodeRef.current = node;
		}

		return () => {
			if (portalNodeRef.current) {
				try {
					document.body.removeChild(portalNodeRef.current);
				} catch (e) {
					// ignore
				}
				portalNodeRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		// compute portal positioning based on the provided anchorRef (preferred)
		// or fallback to the mount element's parent.
		const compute = () => {
			try {
				const anchorEl = props.anchorRef?.current || mountRef.current?.parentElement;
				if (!anchorEl) return setPortalStyle(null);
				const rect = anchorEl.getBoundingClientRect();
				// Position overlay below the anchor to avoid covering the bell
				const top = Math.max(rect.bottom + 6, 8);

				// Initial placement: anchor to the right edge using left fallback.
				const initialLeft = Math.min(Math.max(rect.right - 320, 8), window.innerWidth - 8);
				setPortalStyle({ position: 'fixed', top: `${top}px`, left: `${initialLeft}px`, zIndex: 1400 });

				// After the portal content renders, measure its width and re-align
				// so the dropdown's right edge lines up with the anchor's right edge.
				requestAnimationFrame(() => {
					try {
						const portalRoot = portalNodeRef.current;
						const container = portalRoot?.firstElementChild?.querySelector('.' + (props.containerClass || '')) || portalRoot?.firstElementChild;
						const measured = portalRoot?.firstElementChild?.getBoundingClientRect();
						const width = measured?.width || (portalRoot?.firstElementChild?.offsetWidth) || 320;
						const desiredLeft = Math.min(Math.max(rect.right - width - 8, 8), window.innerWidth - width - 8);
						setPortalStyle((s) => ({ ...(s || {}), left: `${desiredLeft}px` }));
					} catch (e) {
						// ignore measurement errors
					}
				});
			} catch (e) {
				setPortalStyle(null);
			}
		};

		compute();
		window.addEventListener('resize', compute);
		window.addEventListener('scroll', compute, { passive: true });
		return () => {
			window.removeEventListener('resize', compute);
			window.removeEventListener('scroll', compute);
		};
	}, [props.open, props.anchorRef]);

	// If portal node not ready or dropdown closed, render normally to keep behavior simple
	const content = (
		<span ref={mountRef} style={{ display: 'contents' }}>
			<NotificationContent title={title} className={className} portalStyle={portalStyle} {...props} />
		</span>
	);

	if (portalNodeRef.current && portalStyle && props.open) {
		return createPortal(content, portalNodeRef.current);
	}

	return content;
};

Notification.propTypes = {
	title: PropTypes.string,
	className: PropTypes.string,
};

Notification.defaultProps = {
	title: 'Notifications',
	className: undefined,
};

export default memo(Notification);

/**
 * Factory helper to create a role-specific notification wrapper component.
 * Usage: export default createRoleNotifications(initialItems, 'Title', className)
 */
export const createRoleNotifications = (initialItems = [], defaultTitle = 'Notifications', defaultClassName) => {
	return function RoleNotifications({ show, onClose, onCountChange }) {
		const [notifications, setNotifications] = React.useState(initialItems);

		React.useEffect(() => {
			if (onCountChange) onCountChange(notifications.length);
		}, [notifications, onCountChange]);

		const handleDelete = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
		const handleClearAll = () => setNotifications([]);

		return (
			<Notification
				items={notifications}
				open={show}
				onClose={onClose}
				onDelete={handleDelete}
				onClear={handleClearAll}
				title={defaultTitle}
				className={defaultClassName}
			/>
		);
	};
};
