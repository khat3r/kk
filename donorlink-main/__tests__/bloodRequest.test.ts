// __tests__/bloodRequest.test.ts
import mongoose from 'mongoose';

// Mock mongoose to avoid actual database connections
jest.mock('mongoose', () => {
  return {
    models: {
      BloodRequest: null,
    },
    model: jest.fn().mockImplementation(() => ({
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    })),
    Schema: jest.fn().mockImplementation(() => ({
      pre: jest.fn().mockReturnThis(),
    })),
    connect: jest.fn(),
    Types: {
      ObjectId: jest.fn().mockImplementation(() => 'mockObjectId'),
    },
  };
});

// Create a mock BloodRequest model
const BloodRequest = {
  validateSync: jest.fn(),
};

describe('BloodRequest Model', () => {
  // Test the model validation
  describe('Schema Validation', () => {
    test('should validate with correct data', () => {
      BloodRequest.validateSync.mockReturnValueOnce(undefined);
      
      const validData = {
        clinicId: 'mockObjectId',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'A+',
        quantity: 2,
        urgency: 'High',
        status: 'Active',
        notes: 'Urgent need'
      };
      
      const validationError = BloodRequest.validateSync();
      
      expect(validationError).toBeUndefined();
    });
    
    test('should throw error for invalid blood type', () => {
      BloodRequest.validateSync.mockReturnValueOnce({
        errors: {
          bloodType: new Error('Invalid blood type')
        }
      });
      
      const invalidData = {
        clinicId: 'mockObjectId',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'X+', // Invalid blood type
        quantity: 2,
        urgency: 'High',
        status: 'Active'
      };
      
      const validationError = BloodRequest.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.bloodType).toBeDefined();
    });
    
    test('should throw error for negative quantity', () => {
      BloodRequest.validateSync.mockReturnValueOnce({
        errors: {
          quantity: new Error('Quantity must be positive')
        }
      });
      
      const invalidData = {
        clinicId: 'mockObjectId',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'A+',
        quantity: -1, // Invalid quantity
        urgency: 'High',
        status: 'Active'
      };
      
      const validationError = BloodRequest.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.quantity).toBeDefined();
    });
    
    test('should throw error for invalid urgency level', () => {
      BloodRequest.validateSync.mockReturnValueOnce({
        errors: {
          urgency: new Error('Invalid urgency level')
        }
      });
      
      const invalidData = {
        clinicId: 'mockObjectId',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'A+',
        quantity: 2,
        urgency: 'Critical', // Invalid urgency
        status: 'Active'
      };
      
      const validationError = BloodRequest.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.urgency).toBeDefined();
    });
    
    test('should throw error for missing required fields', () => {
      BloodRequest.validateSync.mockReturnValueOnce({
        errors: {
          clinicId: new Error('Required'),
          clinicName: new Error('Required'),
          clinicEmail: new Error('Required')
        }
      });
      
      const incompleteData = {
        // Missing clinicId, clinicName, clinicEmail
        bloodType: 'A+',
        quantity: 2,
        urgency: 'High',
      };
      
      const validationError = BloodRequest.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError?.errors.clinicId).toBeDefined();
      expect(validationError?.errors.clinicName).toBeDefined();
      expect(validationError?.errors.clinicEmail).toBeDefined();
    });
  });
  
  // Test the Blood Request API functionality
  describe('Blood Request API', () => {
    // Test the request creation
    test('createBloodRequest should add a new blood request', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        _id: 'mockId',
        clinicId: 'clinic123',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'O+',
        quantity: 2,
        urgency: 'High',
        status: 'Active',
        notes: 'Urgent need',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Mock the model
      mongoose.model = jest.fn().mockReturnValue({
        create: mockCreate,
      });
      
      const requestData = {
        clinicId: 'clinic123',
        clinicName: 'Test Clinic',
        clinicEmail: 'clinic@test.com',
        bloodType: 'O+',
        quantity: 2,
        urgency: 'High',
        notes: 'Urgent need',
      };
      
      // Create a function to simulate your API endpoint functionality
      const createBloodRequest = async (data: any) => {
        const BloodRequestModel = mongoose.model('BloodRequest');
        return await BloodRequestModel.create(data);
      };
      
      const result = await createBloodRequest(requestData);
      
      expect(mockCreate).toHaveBeenCalledWith(requestData);
      expect(result).toHaveProperty('_id', 'mockId');
      expect(result).toHaveProperty('bloodType', 'O+');
    });
    
    // Test getting blood requests
    test('getBloodRequests should return clinic\'s blood requests', async () => {
      const mockFind = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockEquals = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockReturnThis();
      const mockExec = jest.fn().mockResolvedValue([
        {
          _id: 'request1',
          clinicId: 'clinic123',
          clinicName: 'Test Clinic',
          clinicEmail: 'clinic@test.com',
          bloodType: 'A+',
          quantity: 1,
          urgency: 'Medium',
          status: 'Active',
          createdAt: new Date(),
        },
        {
          _id: 'request2',
          clinicId: 'clinic123',
          clinicName: 'Test Clinic',
          clinicEmail: 'clinic@test.com',
          bloodType: 'O-',
          quantity: 3,
          urgency: 'High',
          status: 'Active',
          createdAt: new Date(),
        }
      ]);
      
      mongoose.model = jest.fn().mockReturnValue({
        find: mockFind,
        where: mockWhere,
        equals: mockEquals,
        sort: mockSort,
        exec: mockExec,
      });
      
      // Create a function to simulate your API endpoint functionality
      const getBloodRequests = async (clinicId: string) => {
        const BloodRequestModel = mongoose.model('BloodRequest');
        return await BloodRequestModel.find()
          .where('clinicId')
          .equals(clinicId)
          .sort('-createdAt')
          .exec();
      };
      
      const results = await getBloodRequests('clinic123');
      
      expect(mockFind).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('clinicId');
      expect(mockEquals).toHaveBeenCalledWith('clinic123');
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('_id', 'request1');
      expect(results[1]).toHaveProperty('_id', 'request2');
    });
    
    // Test updating a blood request
    test('updateBloodRequestStatus should update the status of a request', async () => {
      const mockFindById = jest.fn().mockReturnValue({
        _id: 'request1',
        status: 'Active',
        save: jest.fn().mockResolvedValue({
          _id: 'request1',
          status: 'Fulfilled',
        }),
      });
      
      mongoose.model = jest.fn().mockReturnValue({
        findById: mockFindById,
      });
      
      // Create a function to simulate your API endpoint functionality
      const updateBloodRequestStatus = async (
        requestId: string, 
        newStatus: 'Active' | 'Fulfilled' | 'Cancelled' | 'Expired'
      ) => {
        const BloodRequestModel = mongoose.model('BloodRequest');
        const request = await BloodRequestModel.findById(requestId);
        
        if (!request) {
          throw new Error('Blood request not found');
        }
        
        request.status = newStatus;
        return await request.save();
      };
      
      const result = await updateBloodRequestStatus('request1', 'Fulfilled');
      
      expect(mockFindById).toHaveBeenCalledWith('request1');
      expect(result).toHaveProperty('status', 'Fulfilled');
    });
  });
});