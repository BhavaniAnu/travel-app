const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.aliasTopTours = (req, res, next) => { // prefilling tour values
    req.query.limit = '5'; // limit to only 5 values
    req.query.sort = '-ratingsAverage,price'; // sort by values
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty'; // includes only these fields
    next();
};

exports.getAllTours =  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours
        }
    });
});

exports.getTour =  catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        });
});

exports.updateTour =  catchAsync(async (req, res, next) => {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!tour) {
            return next(new AppError('No tour found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        }); 
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
    
});

exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([  
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty'},
                numTours: { $sum: 1 }, // adding 1 to each doc going through this pipeline
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price'},
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 } // here 1 is used to display in ascending order
        }
        // {
        //     $match: { _id: { $ne: 'EASY'} }
        // }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    }); 
});

exports.getMonthlyPlan =  catchAsync(async (req, res, next) => {
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates' // creates each document for one start date (9*3 = 27 docs)
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' }, // ex : month - 2
                numTourStarts: { $sum: 1 }, // 1 tour of that month
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0  // '0' makes sure that id is not displayed, '1' does display it
            }
        },
        {
            $sort: { numTourStarts: -1 } // -1 for descending order
        },
        {
            $limit: 12 // only 12 docs allowed
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            plan
        }
    });
});