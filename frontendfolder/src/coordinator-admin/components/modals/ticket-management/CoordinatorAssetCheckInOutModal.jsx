import React, { useMemo, useState, useEffect } from 'react';
import ModalWrapper from "../../../../shared/modals/ModalWrapper";
import styles from "./CoordinatorOpenTicketModal.module.css";

export default function CoordinatorAssetCheckInOutModal({ ticket, onClose, onSelectAsset, initialSelectedAsset = null }) {
 	const [selectedAsset, setSelectedAsset] = useState(initialSelectedAsset);

	useEffect(() => {
		setSelectedAsset(initialSelectedAsset || null);
	}, [initialSelectedAsset]);

	const assets = useMemo(() => ([
		{ id: 'AST-001', name: 'Dell Latitude 5420', productType: 'Laptop', quantity: 15, location: 'Warehouse A', status: 'Available' },
		{ id: 'AST-002', name: 'HP EliteBook 840', productType: 'Laptop', quantity: 0, location: 'Warehouse A', status: 'Out of Stock' },
		{ id: 'AST-003', name: 'Epson PowerLite 1795F', productType: 'Projector', quantity: 3, location: 'Main Office - Room 301', status: 'Available' },
		{ id: 'AST-004', name: 'Canon LBP Printer', productType: 'Printer', quantity: 6, location: 'Warehouse B', status: 'Available' },
		{ id: 'AST-005', name: 'Logitech M510', productType: 'Mouse', quantity: 25, location: 'Warehouse B', status: 'Available' },
		{ id: 'AST-006', name: 'Dell KB216', productType: 'Keyboard', quantity: 20, location: 'Warehouse B', status: 'Available' }
	]), []);

	// If ticket.subCategory is provided (e.g., 'Laptop'), filter to that product type,
	// otherwise show all assets so the coordinator can pick.
	const filteredAssets = useMemo(() => {
		if (ticket?.subCategory) {
			return assets.filter(a => String(a.productType).toLowerCase() === String(ticket.subCategory).toLowerCase());
		}
		return assets;
	}, [ticket, assets]);

	const handleSelect = (a) => {
		setSelectedAsset(a);
	};

	const handleConfirm = () => {
		if (onSelectAsset) onSelectAsset(selectedAsset);
		onClose();
	};

	return (
		<ModalWrapper onClose={onClose} size="sm">
			<div style={{ padding: 12 }}>
				<h3 style={{ marginTop: 0 }}>Asset Check In / Out</h3>


				{/* Show table for requested / available assets. If ticket.subCategory exists we indicate requested asset */}
				{(
					<div className={styles.assetTableWrap}>
						<div className={styles.assetTableHeader}>{ticket?.subCategory ? `Requested Asset` : 'Available Assets'}</div>
						<table className={styles.assetTable}>
							<thead>
								<tr>
									<th>ID</th>
									<th>Name</th>
									<th>Location</th>
									<th>Quantity</th>
									<th>Status</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{filteredAssets.length === 0 && (
									<tr><td colSpan={6} style={{ textAlign: 'center', padding: '12px' }}>No assets found for this type.</td></tr>
								)}
								{filteredAssets.map((a) => (
										<tr key={a.id} className={selectedAsset && selectedAsset.id === a.id ? styles.selectedRow : ''}>
											<td>{a.id}</td>
											<td>
												{a.name}
												{(a.status === 'Available' || a.status === 'Deployable') && (
													<span className={styles.deployableBadge} title="This asset is deployable">✓ Deployable</span>
												)}
											</td>
										<td>{a.location}</td>
										<td>{a.quantity}</td>
											<td>{a.status}</td>
										<td>
											<button type="button" className={styles.selectAssetBtn} onClick={() => handleSelect(a)}>
												{selectedAsset && selectedAsset.id === a.id ? 'Selected' : 'Select'}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
						{selectedAsset && (
							<div className={styles.selectedAssetSummary}>Selected: {selectedAsset.name} ({selectedAsset.id})</div>
						)}
					</div>
				)}

				<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
					<button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
					<button type="button" className={styles.submit} onClick={handleConfirm} disabled={!selectedAsset}>Confirm</button>
				</div>
			</div>
		</ModalWrapper>
	);
}
