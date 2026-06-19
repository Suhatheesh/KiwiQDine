import React, { useLayoutEffect, useState, useEffect } from 'react';
import { BankDetails } from '../../features/restaurants/types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../app/store';
import { fetchBankDetailsRequest, updateBankDetailsRequest } from '../../features/restaurants/restaurantsSlice';
import {
  Building2,
  User,
  Hash,
  MapPin,
  Globe,
  CreditCard,
  Pencil,
  Save,
  X,
  CreditCard as BankIcon
} from 'lucide-react';

interface BankDetailsTabProps {
  restaurantId?: string;
}

const BankDetailsTab: React.FC<BankDetailsTabProps> = ({ restaurantId }) => {

  const dispatch = useDispatch<AppDispatch>()

  const { bankDetails: bankData } = useSelector((state: RootState) => state.restaurant)

  const [editMode, setEditMode] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>(bankData);

  useEffect(() => {
    setBankDetails(bankData);
  }, [bankData]);

  useLayoutEffect(() => {
    if (!restaurantId) return;
    dispatch(fetchBankDetailsRequest(restaurantId));
  }, [dispatch, restaurantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!bankDetails) return;
    setBankDetails({ ...bankDetails, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setBankDetails(bankData);
  };

  const handleSave = async () => {
    if (!restaurantId) return;
    dispatch(updateBankDetailsRequest({
      bankDetails: {
        accountName: bankDetails.accountName,
        accountNumber: bankDetails.accountNumber,
        bankName: bankDetails.bankName,
        branch: bankDetails.branch,
        iban: bankDetails.iban,
        swiftCode: bankDetails.swiftCode
      }, restaurantId
    }));
    setEditMode(false);
  };

  const InfoItem = ({ icon: Icon, label, value, name, placeholder }: {
    icon: any,
    label: string,
    value: string,
    name: string,
    placeholder: string
  }) => (
    <div className="flex flex-col space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
        <Icon size={14} className="mr-1.5 text-indigo-500" />
        {label}
      </label>
      {editMode ? (
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={handleChange}
          className="w-full border-gray-200 border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all bg-white hover:border-indigo-200"
          placeholder={placeholder}
        />
      ) : (
        <div className="bg-gray-50/50 border border-transparent rounded-xl px-4 py-2.5 text-gray-800 font-medium">
          {value || <span className="text-gray-400 italic font-normal">Not provided</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto mt-8 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
              <BankIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
              <p className="text-sm text-gray-500">Manage your restaurant payout information</p>
            </div>
          </div>

          {!editMode && (
            <button
              onClick={handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Pencil size={16} />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <InfoItem
              icon={Building2}
              label="Bank Name"
              value={bankDetails.bankName || ''}
              name="bankName"
              placeholder="e.g. Chase Bank"
            />
            <InfoItem
              icon={User}
              label="Account Name"
              value={bankDetails.accountName || ''}
              name="accountName"
              placeholder="Full name as on account"
            />
            <InfoItem
              icon={Hash}
              label="Account Number"
              value={bankDetails.accountNumber || ''}
              name="accountNumber"
              placeholder="Your bank account number"
            />
            <InfoItem
              icon={MapPin}
              label="Branch"
              value={bankDetails.branch || ''}
              name="branch"
              placeholder="Branch details"
            />
            <InfoItem
              icon={CreditCard}
              label="IBAN"
              value={bankDetails.iban || ''}
              name="iban"
              placeholder="International Bank Account Number"
            />
            <InfoItem
              icon={Globe}
              label="SWIFT Code"
              value={bankDetails.swiftCode || ''}
              name="swiftCode"
              placeholder="SWIFT/BIC code"
            />
          </div>

          {editMode && (
            <div className="mt-12 flex items-center space-x-4 border-t border-gray-50 pt-8 animate-fadeIn">
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
              >
                <Save size={18} />
                <span>Save Changes</span>
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Note */}
      <p className="mt-4 text-center text-sm text-gray-400">
        All bank details are stored securely and used only for payouts.
      </p>
    </div>
  );
};

export default BankDetailsTab;
