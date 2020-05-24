//Fisher-Yates shuffle, https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm

export function shuffle(array){
	for(let i = array.length - 1; i>0; i--){
		let j = randInt(0, i+1);
		[array[i], array[j]] = [array[j], array[i]] //swap
	}
}
export function randInt(lower, upper){ //lower <= randInt < upper
	return Math.floor(Math.random()*(upper - lower) + lower);
}