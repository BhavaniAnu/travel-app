class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));  

        return this;
    }

    sort() {
        if(this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy); // here '-' indicates descending order
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields); // includes fields only which is mentioned in query
        } else {
            this.query = this.query.select('-__v'); // excludes __v only, here '-' indicates excluding
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; // by multiplying query string into 1 we are converting string value to number
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit; // ex: p=3, l=10, s= 2 * 10=20, so skip 20 pages

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;