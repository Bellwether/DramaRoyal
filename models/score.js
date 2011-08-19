model = {}

// br = ( (avg_num_votes * avg_rating) + (this_num_votes * this_rating) ) / (avg_num_votes + this_num_votes)
// 
// Legend:
// 
// avg_num_votes: The average number of votes of all items that have num_votes>0 
// avg_rating: The average rating of each item (again, of those that have num_votes>0) 
// this_num_votes: number of votes for this item 
// this_rating: the rating of this item 
// 
// Note: avg_num_votes is used as the “magic” weight in this formula. The higher this value, the more votes it takes to influence the bayesian rating value.


// avg number of wins
// avg health of wins (for wins > 0)
// this number of wins
// this win health