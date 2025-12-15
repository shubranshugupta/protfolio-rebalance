import { useState } from 'react';
import { Menu, MenuItem, ListItemIcon, 
    ListItemText, Box, Button, Alert, Modal } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp'; 
import { parseGrowwFile } from '../utils/growwParser';

const ImportPortfolio = ({ funds, setFunds, isMobile }) => {
    const [anchorEl, setAnchorEl] = useState(null); 
    const [selectedBroker, setSelectedBroker] = useState(null); 

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // --- STEP 1: Menu Click (Only Opens Modal) ---
    const triggerFileSelect = (broker) => {
        setSelectedBroker(broker);
        handleMenuClose();
        handleOpen(); // Open the warning modal FIRST
    };

    // --- STEP 2: Proceed Click (Closes Modal -> Clicks Input) ---
    const handleProceed = () => {
        handleClose(); // Close the modal
        document.getElementById('import-broker-file').click();
    };

    const handleBrokerFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            let importedFunds = [];
            switch (selectedBroker) {
                case 'groww':
                    importedFunds = await parseGrowwFile(file);
                    break;
                case 'zerodha':
                    alert("Zerodha parser coming soon!");
                    return;
                default:
                    alert("Unknown broker selected");
                    return;
            }

            const mergedFunds = importedFunds.map(newFund => {
                const existing = funds.find(f => f.name === newFund.name);
                return {
                    ...newFund,
                    target: existing ? existing.target : 0
                };
            });

            setFunds(mergedFunds);
            alert(`Successfully imported funds from ${selectedBroker.charAt(0).toUpperCase() + selectedBroker.slice(1)}!`);

        } catch (error) {
            alert(`Error importing: ${error}`);
        } finally {
            event.target.value = ''; 
            setSelectedBroker(null);
        }
    };

    return (
        <Box width={isMobile ? "100%" : "auto"}>
            <input
                type="file"
                id="import-broker-file"
                style={{ display: 'none' }}
                accept=".csv,.xlsx,.xls"
                onChange={handleBrokerFileChange}
            />

            <Box width={isMobile ? "100%" : "auto"}>
                <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleMenuClick}
                    color="warning"
                    fullWidth={isMobile}
                    endIcon={<span style={{ fontSize: '0.7em' }}>▼</span>}
                    sx={{ minHeight: 55 }}
                >
                    Import Portfolio
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={() => triggerFileSelect('groww')}>
                        <ListItemIcon sx={{ mR: 1 }}>
                            <img 
                                src="/groww.png"
                                alt="Groww" 
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
                            />
                        </ListItemIcon>
                        <ListItemText>Groww</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => triggerFileSelect('zerodha')} disabled>
                        <ListItemIcon>
                            <img 
                                src="/zerodha-kite.png"
                                alt="zerodha" 
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
                            />
                        </ListItemIcon>
                        <ListItemText>Zerodha (Kite)</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>

            {/* --- MODAL --- */}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Alert 
                    severity="warning" 
                    onClose={handleProceed}
                    sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        width: isMobile ? '90%' : '500px', // Better width control
                        boxShadow: 24,
                        p: 4
                    }}
                >
                    <strong>Privacy Note:</strong> Your data is processed locally on your device. 
                    <br/><br/>
                    For added privacy, please remove personal details (Name, PAN, Mobile) before importing.
                </Alert>
            </Modal>
        </Box>
    );
};

export default ImportPortfolio;