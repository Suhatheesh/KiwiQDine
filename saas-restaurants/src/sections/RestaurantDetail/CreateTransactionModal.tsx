import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { TextArea } from '../../components/TextArea';
import { Select } from '../../components/Select';
import ImageUploadInput from '../../components/ImageUploadInput';
import { toast } from 'react-toastify';
import TransactionsAPI from '../../features/transactions/transactionsAPI';

interface CreateTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    onSuccess: () => void;
}

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
    isOpen,
    onClose,
    restaurantId,
    onSuccess,
}) => {
    const [amount, setAmount] = useState<string>('');
    const [type, setType] = useState<'payout' | 'earned' | 'adjustment'>('payout');
    const [description, setDescription] = useState<string>('');
    const [attachmentUrl, setAttachmentUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (file: File | null) => {
        if (!file) {
            setAttachmentUrl('');
            return;
        }
        setUploading(true);
        try {
            const res: any = await TransactionsAPI.uploadAttachment(file, restaurantId);
            const url = res.data?.publicUrl || res.publicUrl || res.url;
            setAttachmentUrl(url);
            toast.success('Attachment uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload attachment');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            await TransactionsAPI.createTransaction(restaurantId, {
                amount: Number(amount),
                type,
                description,
                attachmentUrl,
                status: 'Completed',
            });
            toast.success('Transaction created successfully');
            onSuccess();
            onClose();
            // Reset form
            setAmount('');
            setType('payout');
            setDescription('');
            setAttachmentUrl('');
        } catch (error) {
            console.error('Transaction creation error:', error);
            toast.error('Failed to create transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Create New Transaction"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} isLoading={loading} disabled={uploading}>
                        Create Transaction
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Amount (NZD)"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                    <Select
                        label="Transaction Type"
                        options={[
                            { value: 'payout', label: 'Payout (Wallet Return)' },
                            { value: 'earned', label: 'Earned' },
                            { value: 'adjustment', label: 'Adjustment' },
                        ]}
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        required
                    />
                </div>
                <div>
                    <TextArea
                        label="Description"
                        placeholder="Describe the transaction..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Attachment (Receipt)</label>
                    <ImageUploadInput
                        value={attachmentUrl}
                        onChange={handleImageUpload}
                        placeholder="Upload receipt"
                    />
                </div>
            </form>
        </Modal>
    );
};
