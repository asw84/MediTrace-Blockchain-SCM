import { useState, useEffect } from "react";
import {
    Clock, CheckCircle, Truck, Package, AlertCircle,
    Loader, FileText, ExternalLink, User, Hash
} from "lucide-react";
import { updateShipmentStatusWithNote, getShipmentNotes } from "../services/api";

const ShipmentTimeline = ({ trackingId, onStatusUpdate }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: "", message: "", txHash: "" });

    const [formData, setFormData] = useState({
        status: "",
        note: ""
    });

    // Status configuration
    const statusConfig = {
        0: { name: "Pending", icon: Clock, color: "yellow", bgColor: "bg-yellow-500" },
        1: { name: "In Transit", icon: Truck, color: "blue", bgColor: "bg-blue-500" },
        2: { name: "Delivered", icon: CheckCircle, color: "green", bgColor: "bg-green-500" }
    };

    useEffect(() => {
        if (trackingId) {
            fetchNotes();
        }
    }, [trackingId]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const response = await getShipmentNotes(trackingId);
            setNotes(response.data.notes || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
            // Don't show error if shipment just doesn't have notes yet
            if (!error.response?.data?.error?.includes("not found")) {
                showNotification("error", "Error fetching shipment history");
            }
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type, message, txHash = "") => {
        setNotification({ show: true, type, message, txHash });
        if (type === "success") {
            setTimeout(() => setNotification({ show: false, type: "", message: "", txHash: "" }), 10000);
        } else {
            setTimeout(() => setNotification({ show: false, type: "", message: "", txHash: "" }), 5000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.status || !formData.note.trim()) {
            showNotification("error", "Please select a status and enter a note");
            return;
        }

        try {
            setSubmitting(true);
            showNotification("info", "Transaction is being confirmed on Blockchain...");

            const response = await updateShipmentStatusWithNote({
                trackingId,
                status: parseInt(formData.status),
                note: formData.note
            });

            showNotification(
                "success",
                "Status updated successfully on blockchain!",
                response.data.transactionHash
            );

            // Refresh notes and reset form
            await fetchNotes();
            setFormData({ status: "", note: "" });

            // Callback to parent component
            if (onStatusUpdate) {
                onStatusUpdate();
            }

        } catch (error) {
            console.error("Error updating status:", error);
            const errorMessage = error.response?.data?.error || "Error updating shipment status";
            showNotification("error", errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const formatAddress = (address) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
                <div className="flex items-center">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg mr-4">
                        <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-white">Shipment Timeline</h3>
                        <p className="text-purple-200 text-sm flex items-center mt-1">
                            <Hash className="h-4 w-4 mr-1" />
                            {trackingId}
                        </p>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification.show && (
                <div className={`m-4 p-4 rounded-lg flex items-start ${notification.type === "success" ? "bg-green-900/50 text-green-300 border border-green-700" :
                        notification.type === "info" ? "bg-blue-900/50 text-blue-300 border border-blue-700" :
                            "bg-red-900/50 text-red-300 border border-red-700"
                    }`}>
                    {notification.type === "success" ? (
                        <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    ) : notification.type === "info" ? (
                        <Loader className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 animate-spin" />
                    ) : (
                        <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                        <p>{notification.message}</p>
                        {notification.txHash && (
                            <a
                                href={`https://etherscan.io/tx/${notification.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-green-400 hover:text-green-300 text-sm"
                            >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Transaction: {notification.txHash.slice(0, 10)}...{notification.txHash.slice(-8)}
                            </a>
                        )}
                    </div>
                </div>
            )}

            <div className="p-6">
                {/* Update Form */}
                <form onSubmit={handleSubmit} className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Truck className="h-5 w-5 mr-2 text-purple-400" />
                        Update Status with Note
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">New Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                disabled={submitting}
                            >
                                <option value="">Select Status</option>
                                <option value="0">🕐 Pending</option>
                                <option value="1">🚚 In Transit</option>
                                <option value="2">✅ Delivered</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status Note</label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Enter a note describing this status update (e.g., 'Package picked up from warehouse', 'Arrived at distribution center')"
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                            disabled={submitting}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-lg font-medium transition-all duration-300 ${submitting
                                ? "bg-purple-800 text-purple-300 cursor-not-allowed"
                                : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                            }`}
                    >
                        {submitting ? (
                            <>
                                <Loader className="animate-spin h-5 w-5 mr-2" />
                                Confirming on Blockchain...
                            </>
                        ) : (
                            <>
                                <Package className="h-5 w-5 mr-2" />
                                Submit to Blockchain
                            </>
                        )}
                    </button>
                </form>

                {/* Timeline Section */}
                <div>
                    <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-purple-400" />
                        Audit Trail History
                        {notes.length > 0 && (
                            <span className="ml-2 bg-purple-900 text-purple-300 text-xs font-medium px-2 py-1 rounded-full">
                                {notes.length} entries
                            </span>
                        )}
                    </h4>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader className="h-8 w-8 text-purple-500 animate-spin mb-3" />
                            <p className="text-gray-400">Loading timeline...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-8 bg-gray-800/50 rounded-lg border border-gray-700">
                            <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No status updates yet</p>
                            <p className="text-sm text-gray-500 mt-1">Submit a status update to start the audit trail</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-green-500"></div>

                            {/* Timeline items */}
                            <div className="space-y-6">
                                {notes.slice().reverse().map((note, index) => {
                                    const config = statusConfig[note.status] || statusConfig[0];
                                    const StatusIcon = config.icon;

                                    return (
                                        <div key={index} className="relative pl-12">
                                            {/* Timeline dot */}
                                            <div className={`absolute left-0 w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center shadow-lg ring-4 ring-gray-900`}>
                                                <StatusIcon className="h-4 w-4 text-white" />
                                            </div>

                                            {/* Content card */}
                                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-${config.color}-900/50 text-${config.color}-300 border border-${config.color}-700`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {config.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(note.timestamp)}
                                                    </span>
                                                </div>

                                                <p className="text-white mb-3">{note.note}</p>

                                                <div className="flex items-center text-xs text-gray-500">
                                                    <User className="h-3 w-3 mr-1" />
                                                    <span className="font-mono">{formatAddress(note.updatedBy)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShipmentTimeline;
